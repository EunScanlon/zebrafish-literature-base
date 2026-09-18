import crypto from "node:crypto";
import readline from "node:readline/promises";

const input = readline.createInterface({ input: process.stdin, output: process.stdout });
const password = await input.question("访问密码（不会保存明文）：");
input.close();
if (!password) {
  console.error("密码不能为空");
  process.exit(1);
}
console.log(crypto.createHash("sha256").update(password, "utf8").digest("hex"));
