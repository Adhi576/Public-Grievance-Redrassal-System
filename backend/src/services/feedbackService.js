'use strict';

const { Grievance, Feedback, User } = require('../models');

class FeedbackService {
  /**
   * Submit feedback for a CLOSED grievance.
   * Only the owning citizen may submit, and only once per grievance.
   */
  static async submitFeedback(grievanceId, data, citizenUser) {
    const { rating, comment } = data;

    // Validate rating value
    const r = parseInt(rating, 10);
    if (!r || r < 1 || r > 5) {
      throw Object.assign(new Error('Rating must be an integer between 1 and 5.'), { status: 400 });
    }

    // Load grievance
    const g = await Grievance.findByPk(grievanceId);
    if (!g) {
      throw Object.assign(new Error('Grievance not found.'), { status: 404 });
    }

    // Only the owning citizen
    if (g.citizen_id !== citizenUser.user_id) {
      throw Object.assign(new Error('Forbidden: not your grievance.'), { status: 403 });
    }

    // Only for CLOSED grievances
    if (g.current_status !== 'CLOSED') {
      throw Object.assign(
        new Error(`Feedback can only be submitted for CLOSED grievances. Current status: ${g.current_status}.`),
        { status: 400 },
      );
    }

    // Prevent duplicate feedback (also enforced by DB unique constraint on grievance_id)
    const existing = await Feedback.findOne({ where: { grievance_id: grievanceId } });
    if (existing) {
      throw Object.assign(new Error('Feedback has already been submitted for this grievance.'), { status: 409 });
    }

    const feedback = await Feedback.create({
      grievance_id: grievanceId,
      citizen_id: citizenUser.user_id,
      rating: r,
      comment: comment || null,
    });

    return feedback;
  }

  /**
   * Get the feedback for a specific grievance.
   * Citizen (owner), officer (assigned), dept head (same dept), admin.
   */
  static async getFeedback(grievanceId, requestingUser) {
    const g = await Grievance.findByPk(grievanceId);
    if (!g) {
      throw Object.assign(new Error('Grievance not found.'), { status: 404 });
    }

    // Basic ownership check for citizen
    if (requestingUser.role === 'citizen' && g.citizen_id !== requestingUser.user_id) {
      throw Object.assign(new Error('Forbidden: not your grievance.'), { status: 403 });
    }

    const feedback = await Feedback.findOne({
      where: { grievance_id: grievanceId },
      include: [{ model: Grievance, as: 'grievance', attributes: ['grn', 'title', 'current_status'] }],
    });

    return feedback; // null means no feedback yet
  }
}

module.exports = FeedbackService;
