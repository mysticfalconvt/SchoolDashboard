import type { NextApiRequest, NextApiResponse } from 'next';

interface RevalidateRequest {
  pathName: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Check for secret to confirm this is a valid request
  const { pathName } = req.body as RevalidateRequest;
  console.log(req.body);
  console.log('revalidating', pathName);
  if (!pathName) {
    res.status(400).send('No path provided');
    return;
  }
  //   if (req.query.secret !== process.env.MY_SECRET_TOKEN) {
  //     return res.status(401).json({ message: 'Invalid token' });
  //   }

  try {
    await res.revalidate(pathName);
    return res.json({ revalidated: true });
  } catch (err) {
    // If there was an error, Next.js will continue
    // to show the last successfully generated page
    return res.status(500).send('Error revalidating');
  }
}
