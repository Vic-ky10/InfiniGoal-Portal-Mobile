import { supabase } from "@/lib/supabase/client";

import { createNotification } from "@/features/notification";

import {
  INCENTIVE_PAYMENT_STATUS,
  INCENTIVE_STATUS,
  Incentive,
  IncentiveFilters,
  IncentiveWithEmployee,
} from "./incentive.types";

import {
  IncentiveInput,
  ReviewIncentiveInput,
  UpdateIncentiveInput,
} from "./incentive.validation";

const INCENTIVE_CODE_PREFIX = "INC";

const INCENTIVE_SELECT = `
id,
profile_id,
incentive_code,
incentive_type,
title,
description,
amount,
month,
year,
status,
payment_status,
approved_by,
approved_at,
paid_at,
created_by,
created_at,
updated_at
`;

const INCENTIVE_WITH_EMPLOYEE_SELECT = `
id,
profile_id,
incentive_code,
incentive_type,
title,
description,
amount,
month,
year,
status,
payment_status,
approved_by,
approved_at,
paid_at,
created_by,
created_at,
updated_at,
employee:profiles!incentives_profile_id_fkey(
employee_id,
full_name,
email,
department,
designation
),
approver:profiles!incentives_approved_by_fkey(
employee_id,
full_name,
email
),
creator:profiles!incentives_created_by_fkey(
employee_id,
full_name,
email
)
`;

type MaybeArray<T> = T | T[] | null;

type IncentiveRelation = {
  employee_id: string;
  full_name: string;
  email: string;
  department?: string | null;
  designation?: string | null;
};

type IncentiveSelectRow = Incentive & {
  employee: MaybeArray<IncentiveWithEmployee["employee"]>;
  approver: MaybeArray<IncentiveRelation>;
  creator: MaybeArray<IncentiveRelation>;
};

function firstRelation<T>(relation: MaybeArray<T>): T | null {
  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function normalizeIncentive(
  row: IncentiveSelectRow
): IncentiveWithEmployee {
  return {
    ...row,
    employee: firstRelation(row.employee),
    approver: firstRelation(row.approver),
    creator: firstRelation(row.creator),
  };
}

function formatIncentiveCode(value: number) {
  return `${INCENTIVE_CODE_PREFIX}${value
    .toString()
    .padStart(6, "0")}`;
}

export async function getAuthenticatedProfileId() {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

export async function generateIncentiveCode(): Promise<string> {
  const { data, error } = await supabase
    .from("incentives")
    .select("incentive_code")
    .like(
      "incentive_code",
      `${INCENTIVE_CODE_PREFIX}%`
    )
    .order("created_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(
      "Unable to generate incentive code."
    );
  }

  if (!data?.incentive_code) {
    return formatIncentiveCode(1);
  }

  const current = Number(
    data.incentive_code.replace(
      INCENTIVE_CODE_PREFIX,
      ""
    )
  );

  if (Number.isNaN(current)) {
    throw new Error(
      "Latest incentive code is invalid."
    );
  }

  return formatIncentiveCode(current + 1);
}

export async function getIncentives(
  filters: IncentiveFilters = {}
): Promise<IncentiveWithEmployee[]> {
  let query = supabase
    .from("incentives")
    .select(INCENTIVE_WITH_EMPLOYEE_SELECT)
    .order("created_at", {
      ascending: false,
    });

  if (filters.profileId) {
    query = query.eq(
      "profile_id",
      filters.profileId
    );
  }

  if (filters.type) {
    query = query.eq(
      "incentive_type",
      filters.type
    );
  }

  if (filters.status) {
    query = query.eq(
      "status",
      filters.status
    );
  }

  if (filters.paymentStatus) {
    query = query.eq(
      "payment_status",
      filters.paymentStatus
    );
  }

  if (filters.month) {
    query = query.eq(
      "month",
      filters.month
    );
  }

  if (filters.year) {
    query = query.eq(
      "year",
      filters.year
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  return (data as IncentiveSelectRow[]).map(
    normalizeIncentive
  );
}

export async function getEmployeeIncentives(
  profileId: string,
  filters: IncentiveFilters = {}
): Promise<Incentive[]> {
  let query = supabase
    .from("incentives")
    .select(INCENTIVE_SELECT)
    .eq("profile_id", profileId)
    .order("created_at", {
      ascending: false,
    });

  if (filters.type) {
    query = query.eq(
      "incentive_type",
      filters.type
    );
  }

  if (filters.status) {
    query = query.eq(
      "status",
      filters.status
    );
  }

  if (filters.paymentStatus) {
    query = query.eq(
      "payment_status",
      filters.paymentStatus
    );
  }

  if (filters.month) {
    query = query.eq(
      "month",
      filters.month
    );
  }

  if (filters.year) {
    query = query.eq(
      "year",
      filters.year
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  return data as Incentive[];
}

export async function getIncentiveById(
  id: string
): Promise<IncentiveWithEmployee | null> {
  const { data, error } = await supabase
    .from("incentives")
    .select(INCENTIVE_WITH_EMPLOYEE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  return data
    ? normalizeIncentive(data as IncentiveSelectRow)
    : null;
}

export async function createIncentive(
  createdBy: string,
  values: IncentiveInput
) {
  let incentiveCode: string;

  try {
    incentiveCode = await generateIncentiveCode();
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to generate incentive code.",
    };
  }

  const { data, error } = await supabase
    .from("incentives")
    .insert({
      profile_id: values.profile_id,
      incentive_code: incentiveCode,
      incentive_type: values.incentive_type,
      title: values.title,
      description: values.description,
      amount: values.amount,
      month: values.month,
      year: values.year,
      status: INCENTIVE_STATUS.PENDING,
      payment_status: INCENTIVE_PAYMENT_STATUS.PENDING,
      approved_by: null,
      approved_at: null,
      paid_at: null,
      created_by: createdBy,
    })
    .select(INCENTIVE_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  await createNotification({
    profileId: values.profile_id,
    title: "New Incentive Assigned",
    message: `A new incentive ${incentiveCode} of amount ₹${values.amount} has been created for you.`,
    notificationType: "Incentive",
    referenceId: data.id,
    actionUrl: "/employee/incentives",
    createdBy,
  });

  return {
    success: true,
    message: "Incentive created successfully.",
    data: data as Incentive,
  };
}

export async function updateIncentive(
  id: string,
  values: UpdateIncentiveInput
) {
  const existing = await getIncentiveById(id);

  if (!existing) {
    return {
      success: false,
      error: "Incentive was not found.",
    };
  }

  if (existing.status !== INCENTIVE_STATUS.PENDING) {
    return {
      success: false,
      error: "Only pending incentives can be updated.",
    };
  }

  const { data, error } = await supabase
    .from("incentives")
    .update({
      ...values,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", INCENTIVE_STATUS.PENDING)
    .select(INCENTIVE_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Incentive updated successfully.",
    data: data as Incentive,
  };
}

export async function deleteIncentive(id: string) {
  const existing = await getIncentiveById(id);

  if (!existing) {
    return {
      success: false,
      error: "Incentive was not found.",
    };
  }

  if (existing.status !== INCENTIVE_STATUS.PENDING) {
    return {
      success: false,
      error: "Only pending incentives can be deleted.",
    };
  }

  const { error } = await supabase
    .from("incentives")
    .delete()
    .eq("id", id)
    .eq("status", INCENTIVE_STATUS.PENDING);

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  return {
    success: true,
    message: "Incentive deleted successfully.",
  };
}

export async function reviewIncentive(
  reviewerId: string,
  values: ReviewIncentiveInput
) {
  const existing = await getIncentiveById(values.incentiveId);

  if (!existing) {
    return {
      success: false,
      error: "Incentive was not found.",
    };
  }

  if (existing.status !== INCENTIVE_STATUS.PENDING) {
    return {
      success: false,
      error: "Only pending incentives can be reviewed.",
    };
  }

  const { data, error } = await supabase
    .from("incentives")
    .update({
      status: values.status,
      approved_by: reviewerId,
      approved_at: new Date().toISOString(),
    })
    .eq("id", values.incentiveId)
    .eq("status", INCENTIVE_STATUS.PENDING)
    .select(INCENTIVE_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  await createNotification({
    profileId: existing.profile_id,
    title:
      values.status === INCENTIVE_STATUS.APPROVED
        ? "Incentive Approved"
        : "Incentive Rejected",
    message: `Your incentive ${existing.incentive_code} has been ${values.status.toLowerCase()}.`,
    notificationType: "Incentive",
    referenceId: existing.id,
    actionUrl: "/employee/incentives",
    createdBy: reviewerId,
  });

  return {
    success: true,
    message: `Incentive ${values.status.toLowerCase()} successfully.`,
    data: data as Incentive,
  };
}

export async function markIncentivePaid(
  id: string,
  paidBy: string
) {
  const existing = await getIncentiveById(id);

  if (!existing) {
    return {
      success: false,
      error: "Incentive was not found.",
    };
  }

  if (existing.status !== INCENTIVE_STATUS.APPROVED) {
    return {
      success: false,
      error: "Only approved incentives can be marked as paid.",
    };
  }

  if (
    existing.payment_status ===
    INCENTIVE_PAYMENT_STATUS.PAID
  ) {
    return {
      success: false,
      error: "Incentive is already paid.",
    };
  }

  const paidAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("incentives")
    .update({
      payment_status: INCENTIVE_PAYMENT_STATUS.PAID,
      paid_at: paidAt,
    })
    .eq("id", id)
    .eq("status", INCENTIVE_STATUS.APPROVED)
    .select(INCENTIVE_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  await createNotification({
    profileId: existing.profile_id,
    title: "Incentive Paid",
    message: `Your incentive ${existing.incentive_code} has been marked as paid.`,
    notificationType: "Incentive",
    referenceId: existing.id,
    actionUrl: "/employee/incentives",
    createdBy: paidBy,
  });

  return {
    success: true,
    message: "Incentive marked as paid.",
    data: data as Incentive,
  };
}

export async function markIncentivePending(
  id: string,
  updatedBy: string
) {
  const existing = await getIncentiveById(id);

  if (!existing) {
    return {
      success: false,
      error: "Incentive was not found.",
    };
  }

  if (existing.status !== INCENTIVE_STATUS.APPROVED) {
    return {
      success: false,
      error:
        "Only approved incentives can be marked as pending payment.",
    };
  }

  if (
    existing.payment_status ===
    INCENTIVE_PAYMENT_STATUS.PENDING
  ) {
    return {
      success: false,
      error: "Incentive payment status is already pending.",
    };
  }

  const { data, error } = await supabase
    .from("incentives")
    .update({
      payment_status: INCENTIVE_PAYMENT_STATUS.PENDING,
      paid_at: null,
    })
    .eq("id", id)
    .eq("status", INCENTIVE_STATUS.APPROVED)
    .select(INCENTIVE_SELECT)
    .single();

  if (error) {
    return {
      success: false,
      error: error.message,
    };
  }

  await createNotification({
    profileId: existing.profile_id,
    title: "Incentive Payment Pending",
    message: `Your incentive ${existing.incentive_code} payment status has been set to pending.`,
    notificationType: "Incentive",
    referenceId: existing.id,
    actionUrl: "/employee/incentives",
    createdBy: updatedBy,
  });

  return {
    success: true,
    message: "Incentive marked as pending.",
    data: data as Incentive,
  };
}