export async function POST(request: Request) {
  try {
    const body = await request.json();

    const response = await fetch(
      'https://tm5z2nlask.execute-api.ap-south-1.amazonaws.com/prod/complaints',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    return Response.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      {
        message: 'Failed to create complaint',
      },
      {
        status: 500,
      }
    );
  }
}