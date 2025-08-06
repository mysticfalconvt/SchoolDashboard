export default function useRevalidatePage(pathName: string) {
  const sendRevalidationRequest = async (): Promise<Response> => {
    console.log(pathName);
    const apiEndpoint = '/api/revalidate';
    return fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'x-api-key': process.env.NEXT_PUBLIC_API_KEY,
      },
      body: JSON.stringify({
        pathName,
      }),
    });
  };
  return sendRevalidationRequest;
}
