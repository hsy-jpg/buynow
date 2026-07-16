// PreToolUse(Bash) 훅: CONTRIBUTING.md의 "main은 직접 push 금지, PR로만 병합" 규칙을
// 결정적으로(LLM 없이) 검사한다. git push 명령의 대상이 main이면 도구 호출 자체를 막는다.
let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let cmd = "";
  try {
    cmd = JSON.parse(raw).tool_input?.command || "";
  } catch {
    console.log(JSON.stringify({ continue: true }));
    return;
  }

  const pushMatch = /\bgit\s+push\b(.*)$/.exec(cmd);
  let targetsMain = false;
  if (pushMatch) {
    const rest = pushMatch[1].split(/[|&;]/)[0]; // 이후 파이프/체이닝된 명령은 제외
    const tokens = rest.trim().split(/\s+/).filter(Boolean);
    targetsMain = tokens.some((t) => t === "main" || t.split(":").includes("main"));
  }

  if (targetsMain) {
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason:
            "CONTRIBUTING.md 규칙 위반: main은 직접 push할 수 없어요. 본인 브랜치(heeyeon/seoeun/seoyeon 등)로 push한 뒤 GitHub PR을 열어주세요.",
        },
      })
    );
  } else {
    console.log(JSON.stringify({ continue: true }));
  }
});
