import { Router, Request, Response } from 'express';
import { z } from 'zod';

const router = Router();

router.get('/hello', (req: Request, res: Response) => {
  res.json({
    message: 'Hello, World!'
  })
});

router.post('/github', (req: Request, res: Response) => {
  const schema = z.object({
    message: z.string().min(1, 'Message is required')
  });

  const validation = schema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({ Error });
  }

  res.json({ success: true });
});

router.put('/hello', (req: Request, res: Response) => {
  res.json({
    message: 'Hello, World!'
  })
});

router.patch('/hello', (req: Request, res: Response) => {
  res.    json({
    message: 'Hello, World!'
  })
});

router.delete('/hello', (req: Request, res: Response) => {
  res.json({
    message: 'Hello, World!'
  })
});



export default router;