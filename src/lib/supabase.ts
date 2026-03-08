const SUPABASE_SETUP_ERROR_SNIPPETS = [
  "Could not find the table",
  "Could not find a relationship between",
  "in the schema cache",
  'relation "public.',
  "Bucket not found",
  "The resource was not found",
  "fetch failed",
  "ENOTFOUND",
  "ECONNREFUSED",
];

export const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "알 수 없는 오류";
};

export const isSupabaseSetupError = (error: unknown) => {
  const message = getErrorMessage(error);

  return SUPABASE_SETUP_ERROR_SNIPPETS.some((snippet) =>
    message.includes(snippet),
  );
};
