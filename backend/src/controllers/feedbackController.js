'use strict';

const FeedbackService = require('../services/feedbackService');
const { log } = require('../services/auditService');

// ── Submit Feedback ───────────────────────────────────────────────────────────
exports.submit = async (req, res, next) => {
  try {
    const feedback = await FeedbackService.submitFeedback(
      req.params.id,
      req.body,
      req.user,
    );
    await log(
      req.user.user_id,
      'SUBMIT_FEEDBACK',
      'grievance',
      parseInt(req.params.id, 10),
      { feedback_id: feedback.feedback_id, rating: feedback.rating },
      req.ip,
    );
    res.status(201).json({ success: true, message: 'Feedback submitted successfully.', data: feedback });
  } catch (err) { next(err); }
};

// ── Get Feedback ──────────────────────────────────────────────────────────────
exports.get = async (req, res, next) => {
  try {
    const feedback = await FeedbackService.getFeedback(req.params.id, req.user);
    if (!feedback) {
      return res.json({ success: true, message: 'No feedback submitted yet.', data: null });
    }
    res.json({ success: true, data: feedback });
  } catch (err) { next(err); }
};
