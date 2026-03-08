export const readJsonResponse = async <T>(
  response: Response,
): Promise<T | null> => {
  const body = await response.text().catch(() => "");
  const trimmedBody = body.trim();

  if (!trimmedBody) {
    return null;
  }

  try {
    return JSON.parse(trimmedBody) as T;
  } catch {
    return null;
  }
};
