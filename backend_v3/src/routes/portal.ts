import { Router } from 'express';
import { getPortalData } from '@/services/compliance.service';

const router = Router();

router.get('/:id/portal', async (req, res, next) => {
  try {
    const data = await getPortalData(Number(req.params.id));
    res.json(data);
  } catch (error: any) {
    if (error.code === 'CASE_NOT_FOUND') {
      return res.status(404).json(error);
    }

    next(error);
  }
});
export default router;