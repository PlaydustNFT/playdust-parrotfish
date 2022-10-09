import { configure, getLogger } from "log4js";
// logger config

const filename =
  process.env.LOG_FILE_NAME ||
  "/home/ubuntu/logs/automation/transaction_subscription_feed.log";
configure({
  appenders: {
    txfeed: {
      type: "file",
      filename: filename,
      maxLogSize: 5000000000,
      backups: 3,
    },
  }, // max, 5gs; rollover 3x
  categories: { default: { appenders: ["txfeed"], level: "error" } },
});

export const logger = getLogger();
