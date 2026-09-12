import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const exam = await p.exam.findFirst({ where: { active: true } });
  console.log("total:", await p.question.count({ where: { examId: exam.id } }));
}
main().catch((e) => console.error(e)).finally(() => p.$disconnect());