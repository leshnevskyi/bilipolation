export const logger = {
  info: (message: string) => {
    console.log(message);
  },

  success: (message: string) => {
    console.log(`%c${message}`, "color: green");
  },

  error: (message: string) => {
    console.error(`%c${message}`, "color: red");
  },
};
