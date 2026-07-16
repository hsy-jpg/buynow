// PreToolUse(Bash) 훅: git commit 전에, 지금 커밋하려는 파일이 다른 팀원 브랜치에서도
// 이미 수정된 상태인지 검사한다(결정적, LLM 없음). 겹치면 병합 시 충돌 가능성이 높다는
// 뜻이므로 hard block이 아니라 "ask"로 사용자에게 확인만 받는다.
// 네트워크/오프라인 등 어떤 이유로든 검사 자체가 실패하면 커밋을 막지 않는다(fail-open).
const { execSync } = require("node:child_process");

const TEAM_BRANCHES = ["heeyeon", "seoeun", "seoyeon"];

function sh(cmd) {
  return execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function changedFiles(range) {
  try {
    return sh(`git diff --name-only ${range}`).split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

function passthrough() {
  console.log(JSON.stringify({ continue: true }));
}

function run() {
  const staged = changedFiles("--cached");
  if (staged.length === 0) return passthrough();

  const currentBranch = sh("git rev-parse --abbrev-ref HEAD");
  const others = TEAM_BRANCHES.filter((b) => b !== currentBranch);
  if (others.length === 0) return passthrough();

  try {
    sh(`git fetch origin ${others.join(" ")}`);
  } catch {
    return passthrough(); // 오프라인 등 네트워크 문제면 검사를 건너뛴다
  }

  const overlaps = [];
  for (const branch of others) {
    let mergeBase;
    try {
      mergeBase = sh(`git merge-base HEAD origin/${branch}`);
    } catch {
      continue; // 공통 조상이 없거나 원격 브랜치가 아직 없으면 스킵
    }
    const theirFiles = new Set(changedFiles(`${mergeBase}..origin/${branch}`));
    const sharedFiles = staged.filter((f) => theirFiles.has(f));
    if (sharedFiles.length > 0) overlaps.push({ branch, files: sharedFiles });
  }

  if (overlaps.length === 0) return passthrough();

  const detail = overlaps.map((o) => `${o.branch} 브랜치도 수정함: ${o.files.join(", ")}`).join(" / ");
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "ask",
        permissionDecisionReason: `이번 커밋 파일이 다른 팀원 브랜치와 겹쳐요 — 병합 시 충돌 가능성이 있어요. (${detail}) 그대로 커밋하려면 승인해주세요.`,
      },
    })
  );
}

let raw = "";
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  try {
    run();
  } catch {
    passthrough(); // 검사 로직 자체가 실패해도 커밋을 막지 않는다
  }
});
