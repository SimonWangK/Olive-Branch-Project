
  export const formatJsonString = (prompt: string): string => {
    try {
      let result = prompt;
      while (typeof result === 'string' && result.startsWith('"') && result.endsWith('"')) {
        result = JSON.parse(result);
      }
      if (typeof result === 'object') {
        return JSON.stringify(result, null, 2);
      }
      return JSON.stringify(JSON.parse(result), null, 2);
    } catch (error) {
      console.error('Failed to format JSON:', error);
      return prompt;
    }
  };
