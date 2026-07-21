import { supabase } from "@/lib/supabase/client";
import { createNotification } from "@/features/notification";

import { Task, TaskWithProject } from "./task.types";

import { TaskInput, UpdateTaskInput } from "./task.validation";

const TASK_SELECT = `
id,
project_id,
project_member_id,
task_code,
title,
description,
priority,
status,
estimated_hours,
actual_hours,
due_date,
completed_at,
created_by,
created_at,
updated_at,

project:projects!tasks_project_id_fkey(
  project_code,
  project_name
),

member:project_members!tasks_project_member_id_fkey(
  id,
  profile_id,

  profile:profiles!project_members_profile_id_fkey(
    employee_id,
    full_name,
    email,
    department
  )
)
`;

type MaybeArray<T> = T | T[] | null;

type TaskProjectRelation = {
  project_code: string;
  project_name: string;
};

type TaskProfileRelation = {
  employee_id: string;
  full_name: string;
  email: string;
  department: string | null;
};

type TaskMemberRelation = {
  id: string;
  profile_id: string;
  profile: MaybeArray<TaskProfileRelation>;
};

type TaskSelectRow = Task & {
  project: MaybeArray<TaskProjectRelation>;
  member: MaybeArray<TaskMemberRelation>;
};

function firstRelation<T>(relation: MaybeArray<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function normalizeTask(row: TaskSelectRow): TaskWithProject {
  const member = firstRelation(row.member);

  return {
    ...row,
    project: firstRelation(row.project),
    member: member
      ? {
          ...member,
          profile: firstRelation(member.profile),
        }
      : null,
  };
}

function normalizeTasks(rows: TaskSelectRow[] | null): TaskWithProject[] {
  return (rows ?? []).map(normalizeTask);
}

async function generateTaskCode() {
  const { data } = await supabase
    .from("tasks")
    .select("task_code")
    .order("task_code", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (!data) {
    return "TASK001";
  }

  const lastNumber = parseInt(data.task_code.replace("TASK", ""), 10);

  return `TASK${String(lastNumber + 1).padStart(3, "0")}`;
}

export async function getAuthenticatedProfileId() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function getTasks(): Promise<TaskWithProject[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    return [];
  }

  return normalizeTasks(data as unknown as TaskSelectRow[]);
}

export async function getEmployeeTasks(
  profileId: string,
): Promise<TaskWithProject[]> {
  const { data: memberRecords, error: memberError } = await supabase
    .from("project_members")
    .select("id")
    .eq("profile_id", profileId);

  if (memberError) {
    console.error(memberError);
    return [];
  }

  const memberIds = memberRecords?.map((m) => m.id) ?? [];

  if (memberIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .in("project_member_id", memberIds)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    return [];
  }

  return normalizeTasks(data as unknown as TaskSelectRow[]);
}

export async function getTaskById(id: string): Promise<TaskWithProject | null> {
  const { data, error } = await supabase
    .from("tasks")
    .select(TASK_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  if (!data) {
    return null;
  }

  return normalizeTask(data as unknown as TaskSelectRow);
}

export async function createTask(createdBy: string, values: TaskInput) {
  const taskCode = await generateTaskCode();

    const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("========== TASK DEBUG ==========");
  console.log("AUTH UID:", user?.id);
  console.log("CREATED BY:", createdBy);
  console.log("MATCH:", user?.id === createdBy);
  console.log("PROJECT ID:", values.project_id);
  console.log("PROJECT MEMBER ID:", values.project_member_id);
  console.log("================================");


  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: values.project_id,
      project_member_id: values.project_member_id,
      task_code: taskCode,
      title: values.title,
      description: values.description || null,
      priority: values.priority,
      status: values.status,
      estimated_hours: values.estimated_hours ?? null,
      actual_hours: values.actual_hours ?? null,
      due_date: values.due_date,
      created_by: createdBy,
    })
    .select(TASK_SELECT)
    .single();

  if (error) {
    console.log("TASK ERROR:", JSON.stringify(error, null, 2));

    return {
      success: false,
      error: error.message,
    };
  }
  const { data: member } = await supabase
    .from("project_members")
    .select("profile_id")
    .eq("id", values.project_member_id)
    .maybeSingle();


  if (member) {
    await createNotification({
      profileId: member.profile_id,
      title: "New Task Assigned",
      message: `You have been assigned task ${taskCode}.`,
      notificationType: "Task",
      referenceId: data.id,
      actionUrl: "/employee/tasks",
      createdBy,
    });
  }

  return {
    success: true,
    message: "Task created successfully.",
    data: data as Task,
  };
}



export async function updateTask(id: string, values: UpdateTaskInput) {
  const { data, error } = await supabase
    .from("tasks")
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(TASK_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Task updated successfully.",
    data: data as Task,
  };
}

export async function deleteTask(id: string) {
  const { data: task, error: checkError } = await supabase
    .from("tasks")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (checkError) {
    return {
      success: false,
      error: checkError.message,
    };
  }

  if (!task) {
    return {
      success: false,
      error: "Task was not found or has already been deleted.",
    };
  }

  const { error } = await supabase.from("tasks").delete().eq("id", id);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Task deleted successfully.",
  };
}

export async function updateTaskStatus(
  id: string,
  status: string,
  actualHours?: number,
) {
  const updateData: {
    status: string;
    actual_hours?: number;
    completed_at?: string;
    updated_at: string;
  } = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (actualHours !== undefined) {
    updateData.actual_hours = actualHours;
  }

  if (status === "Completed") {
    updateData.completed_at = new Date().toISOString();

    const { data: task } = await supabase
      .from("tasks")
      .select("created_by")
      .eq("id", id)
      .maybeSingle();

    if (task?.created_by) {
      await createNotification({
        profileId: task.created_by,
        title: "Task Completed",
        message: "An employee has completed an assigned task.",
        notificationType: "Task",
        referenceId: id,
        actionUrl: "/tasks",
        createdBy: task.created_by,
      });
    }
  }

  const { error } = await supabase
    .from("tasks")
    .update(updateData)
    .eq("id", id);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Task updated successfully.",
  };
}
