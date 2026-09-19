export function validateChatRequest(request, response, next) {
  const { message, conversation = [] } = request.body || {};
  if (
    typeof message !== "string" ||
    !message.trim() ||
    message.trim().length > 800
  )
    return response
      .status(400)
      .json({
        ok: false,
        error: "message must be a non-empty string of 800 characters or fewer.",
      });
  if (
    !Array.isArray(conversation) ||
    conversation.length > 8 ||
    conversation.some(
      (item) =>
        typeof item?.content !== "string" ||
        !["user", "assistant"].includes(item?.role),
    )
  )
    return response
      .status(400)
      .json({
        ok: false,
        error: "conversation must contain up to 8 user or assistant messages.",
      });
  request.chat = {
    message: message.trim(),
    conversation: conversation.map(({ role, content }) => ({
      role,
      content: content.slice(0, 800),
    })),
  };
  return next();
}
