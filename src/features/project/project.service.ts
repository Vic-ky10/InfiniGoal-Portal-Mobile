import { supabase } from "@/lib/supabase/client";
import { createNotification } from "@/features/notification";

import {
  PROJECT_MEMBER_STATUS,
  PROJECT_STATUS,
  EmployeeProject,
  Project,
  ProjectDashboardStats,
  ProjectFilters,
  ProjectMember,
  ProjectMemberWithEmployee,
  ProjectWithMembers,
} from "./project.types";

import {
  AssignProjectMembersInput,
  ProjectInput,
} from "./project.validation";

const PROJECT_SELECT =
  "id, project_name, project_code, description, priority, progress, start_date, end_date, status, created_by, created_at, updated_at";

const PROJECT_MEMBER_SELECT =
  "id, project_id, profile_id, assigned_by, member_role, status, assigned_at, joined_date, created_at, updated_at";

const PROJECT_MEMBER_WITH_EMPLOYEE_SELECT =
  "id, project_id, profile_id, assigned_by, member_role, status, assigned_at, joined_date, created_at, updated_at, employee:profiles!project_members_profile_id_fkey(employee_id, full_name, email, department, designation)";

const EMPLOYEE_PROJECT_SELECT = `${PROJECT_MEMBER_SELECT}, project:projects!project_members_project_id_fkey(${PROJECT_SELECT})`;

type SupabaseProjectMemberRecord = Omit<
  ProjectMemberWithEmployee,
  "employee"
> & {
  employee:
    | ProjectMemberWithEmployee["employee"]
    | NonNullable<ProjectMemberWithEmployee["employee"]>[];
};

type SupabaseEmployeeProjectRecord = Omit<
  EmployeeProject,
  "project" | "team"
> & {
  project: Project | Project[] | null;
};

function normalizeProjectMembers(
  records: SupabaseProjectMemberRecord[]
): ProjectMemberWithEmployee[] {
  return records.map((record) => ({
    ...record,
    employee: Array.isArray(record.employee)
      ? record.employee[0] ?? null
      : record.employee,
  }));
}

export async function getAuthenticatedProfileId() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function getProjects(
  filters: ProjectFilters = {}
): Promise<ProjectWithMembers[]> {
  let query = supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .order("created_at", {
      ascending: false,
    });

  if (filters.status) {
    query = query.eq("status", filters.status);
  }

  if (filters.priority) {
    query = query.eq("priority", filters.priority);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  let projects = data as Project[];

  const search = filters.search?.toLowerCase();

  if (search) {
    projects = projects.filter(
      (project) =>
        project.project_name.toLowerCase().includes(search) ||
        project.project_code.toLowerCase().includes(search) ||
        project.description?.toLowerCase().includes(search)
    );
  }

  if (projects.length === 0) {
    return [];
  }

  const members = await getProjectMembersByProjectIds(
    projects.map((project) => project.id)
  );

  return projects.map((project) => ({
    ...project,
    members: members.filter(
      (member) => member.project_id === project.id
    ),
  }));
}

export async function getProjectById(
  projectId: string
): Promise<ProjectWithMembers | null> {
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_SELECT)
    .eq("id", projectId)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  if (!data) {
    return null;
  }

  const members = await getProjectMembers(projectId);

  return {
    ...(data as Project),
    members,
  };
}

export async function createProject(
  createdBy: string,
  values: ProjectInput
) {
  const { data, error } = await supabase
    .from("projects")
    .insert({
      project_code: values.project_code,
      project_name: values.project_name,
      description: values.description || null,
      priority: values.priority,
      status: values.status,
      start_date: values.start_date,
      end_date: values.end_date || null,
      created_by: createdBy,
    })
    .select(PROJECT_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Project created successfully.",
    data: data as Project,
  };
}

export async function updateProject(
  projectId: string,
  values: ProjectInput
) {
  const { data, error } = await supabase
    .from("projects")
    .update({
      project_code: values.project_code,
      project_name: values.project_name,
      description: values.description || null,
      priority: values.priority,
      status: values.status,
      start_date: values.start_date,
      end_date: values.end_date || null,
    })
    .eq("id", projectId)
    .select(PROJECT_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Project updated successfully.",
    data: data as Project,
  };
}

export async function archiveProject(
  projectId: string
) {
  const { data, error } = await supabase
    .from("projects")
    .update({
      status: PROJECT_STATUS.ARCHIVED,
    })
    .eq("id", projectId)
    .select(PROJECT_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Project archived successfully.",
    data: data as Project,
  };
}

export async function deleteProject(
  id: string
) {
  const { data: project, error: checkError } =
    await supabase
      .from("projects")
      .select("id")
      .eq("id", id)
      .maybeSingle();

  if (checkError) {
    return {
      success: false,
      error: checkError.message,
    };
  }

  if (!project) {
    return {
      success: false,
      error:
        "Project was not found or has already been deleted.",
    };
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Project deleted successfully.",
  };
}

export async function assignProjectMembers(
  assignedBy: string,
  values: AssignProjectMembersInput
) {
  const project = await getProjectById(values.projectId);

  if (!project) {
    return {
      success: false,
      error: "Project was not found.",
    };
  }

  const uniqueProfileIds = [...new Set(values.profileIds)];

  const { data: existingRows, error: existingError } =
    await supabase
      .from("project_members")
      .select(PROJECT_MEMBER_SELECT)
      .eq("project_id", values.projectId)
      .in("profile_id", uniqueProfileIds);

  if (existingError) {
    return {
      success: false,
      error: existingError.message,
    };
  }

  const existing = (existingRows ?? []) as ProjectMember[];

  const activeIds = new Set(
    existing
      .filter(
        (member) =>
          member.status !== PROJECT_MEMBER_STATUS.REMOVED
      )
      .map((member) => member.profile_id)
  );

  const removedRows = existing.filter(
    (member) =>
      member.status === PROJECT_MEMBER_STATUS.REMOVED
  );

  const insertedRows: ProjectMember[] = [];
  const reactivatedRows: ProjectMember[] = [];

  const newProfileIds = uniqueProfileIds.filter(
    (profileId) =>
      !activeIds.has(profileId) &&
      !removedRows.some(
        (member) => member.profile_id === profileId
      )
  );

  if (newProfileIds.length) {
    const { data, error } = await supabase
      .from("project_members")
      .insert(
        newProfileIds.map((profileId) => ({
          project_id: values.projectId,
          profile_id: profileId,
          assigned_by: assignedBy,
          member_role: values.member_role,
          status: PROJECT_MEMBER_STATUS.ACTIVE,
        }))
      )
      .select(PROJECT_MEMBER_SELECT);

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    insertedRows.push(...((data ?? []) as ProjectMember[]));
  }

  for (const member of removedRows) {
    const { data, error } = await supabase
      .from("project_members")
      .update({
        assigned_by: assignedBy,
        member_role: values.member_role,
        status: PROJECT_MEMBER_STATUS.ACTIVE,
        assigned_at: new Date().toISOString(),
        joined_date: new Date()
          .toISOString()
          .slice(0, 10),
      })
      .eq("id", member.id)
      .select(PROJECT_MEMBER_SELECT)
      .single();

    if (error) {
      return {
        success: false,
        error: error.message,
      };
    }

    reactivatedRows.push(data as ProjectMember);
  }

  const changedRows = [
    ...insertedRows,
    ...reactivatedRows,
  ];

  await Promise.all(
    changedRows.map((member) =>
      createNotification({
        profileId: member.profile_id,
        title: "Project Assigned",
        message: `You have been assigned to ${project.project_name}.`,
        notificationType: "Project",
        referenceId: project.id,
        actionUrl: "/employee/projects",
        createdBy: assignedBy,
      })
    )
  );

  const skippedCount =
    uniqueProfileIds.length - changedRows.length;

  return {
    success: true,
    message:
      skippedCount > 0
        ? `${changedRows.length} employee(s) assigned. ${skippedCount} duplicate assignment(s) skipped.`
        : `${changedRows.length} employee(s) assigned successfully.`,
    data: changedRows,
  };
}

export async function removeProjectMember(
  projectMemberId: string
) {
  const { data, error } = await supabase
    .from("project_members")
    .update({
      status: PROJECT_MEMBER_STATUS.REMOVED,
    })
    .eq("id", projectMemberId)
    .select(PROJECT_MEMBER_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Employee removed from project.",
    data: data as ProjectMember,
  };
}

export async function getProjectMembers(
  projectId: string
): Promise<ProjectMemberWithEmployee[]> {
  const { data, error } = await supabase
    .from("project_members")
    .select(PROJECT_MEMBER_WITH_EMPLOYEE_SELECT)
    .eq("project_id", projectId)
    .neq(
      "status",
      PROJECT_MEMBER_STATUS.REMOVED
    )
    .order("assigned_at", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    return [];
  }

  return normalizeProjectMembers(
    (data ?? []) as SupabaseProjectMemberRecord[]
  );
}

export async function getEmployeeProjects(
  profileId: string
): Promise<EmployeeProject[]> {
  const { data, error } = await supabase
    .from("project_members")
    .select(EMPLOYEE_PROJECT_SELECT)
    .eq("profile_id", profileId)
    .neq(
      "status",
      PROJECT_MEMBER_STATUS.REMOVED
    )
    .order("assigned_at", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    return [];
  }

  const memberships = (
    (data ?? []) as SupabaseEmployeeProjectRecord[]
  ).map((record) => ({
    ...record,
    project: Array.isArray(record.project)
      ? record.project[0] ?? null
      : record.project ?? null,
    team: [],
  }));

  const projectIds = memberships
    .map((membership) => membership.project_id)
    .filter(Boolean);

  const team =
    await getProjectMembersByProjectIds(projectIds);

  return memberships.map((membership) => ({
    ...membership,
    team: team.filter(
      (member) =>
        member.project_id === membership.project_id
    ),
  }));
}

export async function getProjectDashboardStats(): Promise<ProjectDashboardStats> {
  const [
    totalProjects,
    activeProjects,
    completedProjects,
    archivedProjects,
  ] = await Promise.all([
    supabase
      .from("projects")
      .select("id", {
        count: "exact",
        head: true,
      }),

    supabase
      .from("projects")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", PROJECT_STATUS.ACTIVE),

    supabase
      .from("projects")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", PROJECT_STATUS.COMPLETED),

    supabase
      .from("projects")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", PROJECT_STATUS.ARCHIVED),
  ]);

  for (const response of [
    totalProjects,
    activeProjects,
    completedProjects,
    archivedProjects,
  ]) {
    if (response.error) {
      console.error(response.error);
    }
  }

  return {
    totalProjects: totalProjects.count ?? 0,
    activeProjects: activeProjects.count ?? 0,
    completedProjects: completedProjects.count ?? 0,
    archivedProjects: archivedProjects.count ?? 0,
  };
}

async function getProjectMembersByProjectIds(
  projectIds: string[]
) {
  if (projectIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("project_members")
    .select(PROJECT_MEMBER_WITH_EMPLOYEE_SELECT)
    .in("project_id", projectIds)
    .neq(
      "status",
      PROJECT_MEMBER_STATUS.REMOVED
    )
    .order("assigned_at", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    return [];
  }

  return normalizeProjectMembers(
    (data ?? []) as SupabaseProjectMemberRecord[]
  );
}