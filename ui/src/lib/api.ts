const BASE_URL = `${import.meta.env.VITE_CORE_API_URL}/api/v1`;

export const post = async (path: string, data: any) => {
  const response = await fetch(`${BASE_URL}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
};

export const get = async (path: string, queryParams: any) => {
  const response = await fetch(
    `${BASE_URL}/${path}?${new URLSearchParams(queryParams).toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return await response.json();
};
