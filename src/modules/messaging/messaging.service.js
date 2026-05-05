import aiService from '../ai/ai.service.js';
import auditService from '../audit/audit.service.js';
import { maskPhone } from '../security/mask.util.js';

const processMessage = async ({ message, from }) => {
  const maskedUser = maskPhone(from);

  const aiResult = await aiService.parseIntent(message);

  const reply = generateReply(aiResult);

  await auditService.log({
    user: maskedUser,
    input: message,
    ai_output: aiResult,
    response: reply,
  });

  return reply;
};

const generateReply = (aiResult) => {
  if (aiResult.intent === 'reschedule_appointment') {
    return 'Sure, what date would you like to reschedule to?';
  }

  return 'Sorry, I didn’t understand that. Can you rephrase?';
};

export default { processMessage };