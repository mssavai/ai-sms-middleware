export const log = (level, message, meta = {}) => {
    console.log(
      JSON.stringify({
        level,
        message,
        timestamp: new Date().toISOString(),
        ...meta,
      })
    );
  };