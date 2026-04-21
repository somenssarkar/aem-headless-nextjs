import { revalidatePath } from 'next/cache';

export async function POST(req: Request) {
  const body = await req.json();

  if (body.secret !== process.env.REVALIDATE_SECRET) {
    return Response.json({ message: 'Invalid token' }, { status: 401 });
  }

  const path = body.path ?? '/';
  revalidatePath(path);
  revalidatePath('/articles');

  return Response.json({ revalidated: true, path, ts: Date.now() });
}
