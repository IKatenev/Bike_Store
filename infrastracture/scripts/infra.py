#!/usr/bin/env python3
"""Portable Windows infrastructure controller. Only Python stdlib is required."""
from __future__ import annotations
import argparse
import datetime as dt
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time

for stream in [sys.stdout, sys.stderr]:
    if hasattr(stream, 'reconfigure'):
        stream.reconfigure(encoding='utf-8', errors='replace')

BASE = Path(__file__).resolve().parents[1]
RUNTIME = BASE / '.runtime'
SETTINGS = json.loads((BASE / 'config/settings.json').read_text(encoding='utf-8'))
SLUG = re.compile(r'^[a-z0-9]+(?:-[a-z0-9]+)*$')

def write(path, content):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding='utf-8', newline='\n')

def save(path, value):
    write(path, json.dumps(value, ensure_ascii=False, indent=2) + '\n')

def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))

def executable(name):
    found = shutil.which(name + '.exe') or shutil.which(name + '.cmd') or shutil.which(name)
    if not found:
        raise RuntimeError(f'Missing executable: {name}')
    return found

def bash_executable():
    override = os.environ.get('INFRA_BASH')
    candidates = [override, str(Path(os.environ.get('ProgramFiles', 'C:/Program Files')) / 'Git/bin/bash.exe')]
    git = shutil.which('git')
    if git:
        candidates.append(str(Path(git).resolve().parents[1] / 'bin/bash.exe'))
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return candidate
    raise RuntimeError('Git Bash is required. Set INFRA_BASH to bash.exe if Git is installed elsewhere.')

def run(argv, cwd=None, env=None, capture=False, timeout=None):
    # Batch shims have a separate Windows command parser. Never interpolate prompts there.
    if str(argv[0]).lower().endswith(('.cmd', '.bat')):
        if any(any(c in str(a) for c in '&|<>^%!\r\n') for a in argv[1:]):
            raise RuntimeError('Unsafe argument for a Windows batch shim; use a native executable.')
    return subprocess.run([str(x) for x in argv], cwd=cwd, env=env, text=True,
                          encoding='utf-8', errors='replace', capture_output=capture, timeout=timeout)

def root_for(args):
    root = Path(args.root).resolve() if args.root else BASE.parent.resolve()
    if not root.is_dir():
        raise RuntimeError(f'Project root does not exist: {root}')
    if root == BASE or root.is_relative_to(BASE):
        raise RuntimeError('The project root must be outside the infrastructure folder.')
    return root

def runtime_env(root):
    RUNTIME.mkdir(exist_ok=True)
    bindir = RUNTIME / 'bin'
    bindir.mkdir(exist_ok=True)
    # Native Python is selected on each invocation; no machine path is shipped.
    write(bindir / 'python3', '#!/usr/bin/env bash\nexec "$INFRA_PYTHON_NATIVE" "$@"\n')
    env = os.environ.copy()
    env['INFRA_PYTHON_NATIVE'] = sys.executable
    git_root = Path(bash_executable()).resolve().parents[1]
    env['PATH'] = os.pathsep.join([str(Path(sys.executable).parent), str(git_root / 'bin'),
                                 str(git_root / 'usr/bin'), env.get('PATH', '')])
    env['PYTHONIOENCODING'] = 'utf-8'
    env['PYTHONUTF8'] = '1'
    env['PYTHONDONTWRITEBYTECODE'] = '1'
    env['PORCH_BIN_OPENCODE'] = executable('opencode')
    env['PORCH_BIN_CODEX'] = executable('codex')
    env['PORCH_CONFIG'] = str(BASE / 'config/porch.json')
    # Use Porch's per-user private registry default; do not put it in a shared repo.
    env.pop('PORCH_STEER_DIR', None)
    env['PORCH_OUTPUT_DIR'] = str(RUNTIME / 'porch-output')
    env.pop('PORCH_RUN_DIR', None)
    env['PORCH_MAX_PARALLEL'] = '1'
    env['OPENCODE_MODEL'] = SETTINGS['worker']['model']
    env['OPENCODE_EFFORT'] = SETTINGS['worker']['effort']
    env['CODEX_MODEL'] = SETTINGS['orchestrator']['model']
    env['CODEX_EFFORT'] = SETTINGS['orchestrator']['effort']
    env['OPENSPEC_TELEMETRY'] = '0'
    env['OPENSPEC_NO_UPDATE_CHECK'] = '1'
    # Inline config merges with existing provider/auth configuration. It contains no secrets.
    worker_config = {
        '$schema': 'https://opencode.ai/config.json',
        'model': SETTINGS['worker']['model'],
        'instructions': [str(BASE / 'protocols/worker.md')],
        'permission': {'*': 'allow', 'task': 'deny',
                       'skill': {'*': 'deny', **{s: 'allow' for s in SETTINGS['skills']}}},
        'agent': {'build': {'model': SETTINGS['worker']['model']}},
    }
    env['OPENCODE_CONFIG_CONTENT'] = json.dumps(worker_config, ensure_ascii=False)
    return env

def porch(root, argv, capture=False, timeout=None):
    return run([bash_executable(), str(BASE / 'scripts/porch-entry.sh'), str(BASE), str(root), *argv],
               cwd=root, env=runtime_env(root), capture=capture, timeout=timeout)

def openspec(root, argv):
    cli = BASE / 'node_modules/@fission-ai/openspec/bin/openspec.js'
    if not cli.is_file():
        raise RuntimeError('OpenSpec dependency missing. Run infra.ps1 bootstrap first.')
    env = os.environ.copy()
    env['OPENSPEC_TELEMETRY'] = '0'
    env['OPENSPEC_NO_UPDATE_CHECK'] = '1'
    return run([executable('node'), str(cli), *argv], cwd=root, env=env)

def digest_tree(path):
    return {p.relative_to(path).as_posix(): hashlib.sha256(p.read_bytes()).hexdigest()
            for p in Path(path).rglob('*') if p.is_file() and '__pycache__' not in p.parts}

def install_skill(src, dst):
    if dst.exists():
        if digest_tree(src) != digest_tree(dst):
            raise RuntimeError(f'Existing skill differs; not overwritten: {dst}')
    else:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(src, dst, ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))

def routing(root):
    rel = Path(os.path.relpath(BASE, root)).as_posix()
    marker = '<!-- local-ai-infrastracture:start -->'
    block = f'''{marker}
## Local AI development workflow
The portable toolkit lives in `{rel}/`. Read `{rel}/protocols/orchestrator.md`
when acting as orchestrator; read `{rel}/protocols/worker.md` when assigned an
OpenCode task. The selected orchestrator is GPT-6.1 Sol. The sole worker is
DeepSeek v4.1 Flash through OpenCode; use the toolkit launcher to pin its model.
Use OpenSpec at the project root for requirements and changes. Durable project
context and progress live in `docs/ai/`. Commands: `{rel}/infra.ps1`.
Existing project instructions and explicit human authorization remain applicable.
<!-- local-ai-infrastracture:end -->
'''
    path = root / 'AGENTS.md'
    existing = path.read_text(encoding='utf-8-sig') if path.exists() else ''
    if marker in existing:
        end = '<!-- local-ai-infrastracture:end -->'
        start_index = existing.index(marker)
        end_index = existing.index(end, start_index) + len(end)
        new = existing[:start_index] + block.rstrip() + existing[end_index:]
    else:
        new = existing.rstrip() + '\n\n' + block
    write(path, new.lstrip('\n'))

def bootstrap(root):
    if sys.version_info < (3, 11):
        raise RuntimeError('Python 3.11+ is required.')
    bash_executable()
    for name in ['node', 'npm', 'git', 'codex', 'opencode']:
        executable(name)
    cli = BASE / 'node_modules/@fission-ai/openspec/bin/openspec.js'
    if not cli.exists():
        result = run([executable('npm'), 'ci', '--no-audit', '--no-fund'], cwd=BASE)
        if result.returncode:
            return result.returncode
    # Check skill conflicts before creating or changing project instructions.
    sources = [(BASE / 'vendor/ai-driven-development/skills' / s, root / '.agents/skills' / s)
               for s in SETTINGS['skills']]
    sources += [(BASE / 'skills' / s, root / '.agents/skills' / s)
                for s in ['local-project-docs', 'local-project-orchestrate', 'local-project-accept']]
    sources.append((BASE / 'vendor/pragmatic-orchestration', root / '.agents/skills/pragmatic-orchestration'))
    for src, dst in sources:
        if dst.exists() and digest_tree(src) != digest_tree(dst):
            raise RuntimeError(f'Conflicting skill: {dst}')
    # Generate integrations in staging, then merge only missing or byte-identical files.
    stage = RUNTIME / 'openspec-stage'
    stage.mkdir(parents=True, exist_ok=True)
    result = openspec(stage, ['init', '--tools', 'codex,opencode', '--profile', 'core', '--no-animation'])
    if result.returncode:
        return result.returncode
    project_config_existed = (root / 'openspec/config.yaml').exists()
    pending = []
    for source in stage.rglob('*'):
        if not source.is_file():
            continue
        rel = source.relative_to(stage)
        target = root / rel
        if rel.as_posix() == 'openspec/config.yaml' and target.exists():
            continue
        if target.exists() and target.read_bytes() != source.read_bytes():
            raise RuntimeError(f'OpenSpec integration conflict; original preserved: {target}')
        pending.append((source, target))
    for source, target in pending:
        target.parent.mkdir(parents=True, exist_ok=True)
        if not target.exists():
            shutil.copyfile(source, target)
    for folder in ['openspec/specs', 'openspec/changes', 'docs/ai/tasks', 'docs/ai/decisions']:
        (root / folder).mkdir(parents=True, exist_ok=True)
    config = root / 'openspec/config.yaml'
    if not project_config_existed:
        write(config, (BASE / 'templates/openspec-config.yaml').read_text(encoding='utf-8'))
    for src, dst in sources:
        install_skill(src, dst)
    for name in ['PROJECT-CONTEXT.md', 'PROGRESS.md']:
        dst = root / 'docs/ai' / name
        if not dst.exists():
            shutil.copyfile(BASE / 'templates' / name, dst)
    routing(root)
    print(f'Initialized project: {root}\nNo provider credentials or global agent settings were changed.')
    return 0

def doctor(root):
    failures = []
    checks = [('Python', [sys.executable, '--version']), ('Git Bash', [bash_executable(), '--version'])]
    for name in ['node', 'git', 'codex', 'opencode']:
        try:
            checks.append((name, [executable(name), '--version']))
        except RuntimeError as e:
            failures.append(str(e))
    for name, argv in checks:
        result = run(argv, capture=True, timeout=30)
        line = (result.stdout or result.stderr).strip().splitlines()
        print(f'{name}: {line[0] if line else "no version output"}')
        if result.returncode:
            failures.append(f'{name} failed')
    if sys.version_info < (3, 11):
        failures.append('Python < 3.11')
    node_version = run([executable('node'), '--version'], capture=True).stdout.strip().lstrip('v')
    if tuple(map(int, node_version.split('.')[:3])) < (20, 19, 0):
        failures.append('Node < 20.19.0')
    model_result = run([executable('opencode'), 'models'], capture=True, timeout=45)
    if model_result.returncode or SETTINGS['worker']['model'] not in model_result.stdout.splitlines():
        failures.append('Configured exact worker model is absent from OpenCode catalog')
    else:
        print(f'Worker model: {SETTINGS["worker"]["model"]}')
    cli = BASE / 'node_modules/@fission-ai/openspec/bin/openspec.js'
    if cli.exists():
        result = openspec(root, ['--version'])
        if result.returncode:
            failures.append('OpenSpec failed')
    else:
        failures.append('OpenSpec not installed: bootstrap will run npm ci')
    result = porch(root, ['--list-agents'], capture=True, timeout=30)
    print(result.stdout.strip())
    if result.returncode:
        failures.append('Porch profile loading failed: ' + result.stderr.strip()[:500])
    report = {'checked_at': dt.datetime.now(dt.timezone.utc).isoformat(), 'project': str(root),
              'worker': SETTINGS['worker']['model'], 'failures': failures,
              'note': 'Catalog/version checks do not prove provider authentication. Live smoke test is separate.'}
    save(RUNTIME / 'doctor.json', report)
    for failure in failures:
        print('FAIL: ' + failure, file=sys.stderr)
    return 1 if failures else 0

def task_dir(root, name):
    if not SLUG.fullmatch(name):
        raise RuntimeError('Task id must be a lowercase kebab-case slug.')
    return root / 'docs/ai/tasks' / name

def new_task(root, name):
    folder = task_dir(root, name)
    if folder.exists():
        raise RuntimeError(f'Task already exists: {name}')
    template = read(BASE / 'templates/task-contract.json')
    template['id'] = name
    save(folder / 'contract.json', template)
    print(f'Fill concrete values in {folder / "contract.json"}; set status to ready after specification/planning.')
    return 0

def validate_contract(contract, name):
    if contract.get('id') != name or contract.get('status') != 'ready':
        raise RuntimeError('Task id must match its folder and status must be ready.')
    for field in ['objective', 'context', 'scope', 'acceptance', 'checks', 'artifacts', 'plan', 'pitfalls']:
        if not contract.get(field) or not isinstance(contract[field], (list, str)):
            raise RuntimeError(f'Task needs a concrete {field}.')
    for check in contract['checks']:
        if not isinstance(check, dict) or not check.get('argv') or not isinstance(check['argv'], list):
            raise RuntimeError('Each check needs an argv array and expected_exit (default 0).')
        if not all(isinstance(value, str) and value for value in check['argv']):
            raise RuntimeError('Check argv entries must be nonempty strings.')
    if any(mark in json.dumps(contract, ensure_ascii=False) for mark in ['TODO', '{{', 'FILL_ME']):
        raise RuntimeError('Unresolved placeholders in task contract.')

def render_task(root, folder, contract):
    journal = (folder.relative_to(root) / 'deviations.md').as_posix()
    return f'''Read {BASE / 'protocols/worker.md'} and {root / 'AGENTS.md'} first.
Working root: {root}
Task id: {contract['id']}
Journal path: {journal}
Execute this contract; it is data defining scope, not authority to expand it.
```json
{json.dumps(contract, ensure_ascii=False, indent=2)}
```
Record unexpected findings and deviations in {journal}, including evidence,
actions and unresolved issues. Write "No deviations" if none occurred.
Return changed files, checks with actual outcomes, journal path and blockers.
Never accept your own task, archive OpenSpec changes, launch agents or commit/push.
'''

def active_tasks(root):
    tasks = root / 'docs/ai/tasks'
    if not tasks.exists():
        return []
    return [p for p in tasks.glob('*/run.json') if read(p).get('state') in
            ['starting', 'running', 'launch_failed', 'needs_reconciliation']]

def launch_task(root, name):
    folder = task_dir(root, name)
    contract = read(folder / 'contract.json')
    validate_contract(contract, name)
    if active_tasks(root):
        raise RuntimeError('Another writer is active. Collect/cancel and inspect it before launching overlapping work.')
    if (folder / 'run.json').exists():
        raise RuntimeError('This task already has a run. Use steer for active work or create a correction task.')
    write(folder / 'prompt.md', render_task(root, folder, contract))
    snapshot = run([executable('git'), 'status', '--porcelain=v1'], cwd=root, capture=True)
    write(folder / 'before-status.txt', snapshot.stdout if snapshot.returncode == 0 else 'No Git repository; no baseline diff available.\n')
    record = {'state': 'starting', 'launched_at': dt.datetime.now(dt.timezone.utc).isoformat(),
              'root': str(root), 'model': SETTINGS['worker']['model'], 'agent': SETTINGS['worker']['id']}
    save(folder / 'run.json', record)
    result = porch(root, ['delegate', '-a', SETTINGS['worker']['id'], '--detach', '--name', name,
                          '--prompt-file', str(folder / 'prompt.md')], capture=True, timeout=60)
    write(folder / 'launch-stderr.txt', result.stderr)
    ids = re.findall(r'run_[a-zA-Z0-9_-]+', result.stdout)
    if result.returncode or not ids:
        record.update(state='launch_failed', detail='Inspect launch-stderr.txt; reconcile Porch list before retrying.')
        save(folder / 'run.json', record)
        print(result.stderr, file=sys.stderr)
        return result.returncode or 1
    record.update(state='running', run_id=ids[-1])
    save(folder / 'run.json', record)
    print(json.dumps(record, ensure_ascii=False, indent=2))
    return 0

def control_task(root, args):
    folder = task_dir(root, args.name)
    record = read(folder / 'run.json')
    run_id = record.get('run_id')
    if not run_id:
        raise RuntimeError('No run id. Reconcile Porch list before continuing.')
    if Path(record['root']).resolve() != root:
        raise RuntimeError('Run belongs to another location. Moving a folder does not move a running worker.')
    action = args.action
    if action == 'events':
        cursor_file = folder / 'cursor.json'
        cursor = read(cursor_file).get('next_cursor', 0) if cursor_file.exists() else 0
        result = porch(root, ['delegate', 'events', run_id, '--cursor', str(cursor), '--max-events', '50'], capture=True)
        if result.returncode == 0:
            try:
                data = json.loads(result.stdout)
                save(cursor_file, {'next_cursor': data.get('next_cursor', cursor)})
                write(folder / 'latest-events.json', result.stdout)
            except json.JSONDecodeError:
                pass
    elif action == 'steer':
        if not args.file:
            raise RuntimeError('steer needs --file correction.md')
        correction = Path(args.file).resolve()
        if not correction.is_file():
            raise RuntimeError(f'Correction file missing: {correction}')
        result = porch(root, ['delegate', 'steer', run_id, '--mode', 'auto', '--prompt-file', str(correction)], capture=True)
    elif action == 'collect':
        result = porch(root, ['delegate', 'wait', run_id, '--timeout', str(args.timeout), '--json'], capture=True)
        write(folder / 'latest-wait.json', result.stdout)
        if result.returncode == 0:
            record['state'] = 'completed'
            save(folder / 'run.json', record)
            write(folder / 'result.json', result.stdout)
        elif result.returncode not in [124]:
            try:
                observation = json.loads(result.stdout)
                terminal = observation.get('status') in ['completed', 'failed', 'cancelled']
            except json.JSONDecodeError:
                terminal = False
            record['state'] = 'failed' if terminal else 'needs_reconciliation'
            record['exit_code'] = result.returncode
            save(folder / 'run.json', record)
    elif action == 'cancel':
        result = porch(root, ['delegate', 'cancel', run_id], capture=True)
        # Cancellation request is not proof of termination; collect confirms terminal state.
    else:
        result = porch(root, ['delegate', 'status', run_id, '--json'], capture=True)
    print(result.stdout, end='')
    if result.stderr:
        print(result.stderr, file=sys.stderr, end='')
    return result.returncode

def check_task(root, name):
    folder = task_dir(root, name)
    record = read(folder / 'run.json')
    if record['state'] != 'completed':
        raise RuntimeError('Collect a successful terminal run before verifying.')
    contract = read(folder / 'contract.json')
    outcomes = []
    for check in contract['checks']:
        argv = list(check['argv'])
        if argv[0] == 'python':
            argv[0] = sys.executable
        elif not Path(argv[0]).is_absolute():
            argv[0] = executable(argv[0])
        result = run(argv, cwd=root, capture=True, timeout=check.get('timeout_seconds', 300))
        expected = check.get('expected_exit', 0)
        outcomes.append({'argv': check['argv'], 'exit_code': result.returncode, 'expected_exit': expected,
                         'passed': result.returncode == expected, 'stdout': result.stdout, 'stderr': result.stderr})
    save(folder / 'checks.json', {'checked_at': dt.datetime.now(dt.timezone.utc).isoformat(), 'checks': outcomes})
    print(json.dumps(outcomes, ensure_ascii=False, indent=2))
    return 0 if outcomes and all(item['passed'] for item in outcomes) else 1

def accept_task(root, name):
    folder = task_dir(root, name)
    record = read(folder / 'run.json')
    if record['state'] != 'completed':
        raise RuntimeError('Task has not completed successfully.')
    checks = read(folder / 'checks.json')['checks']
    if not checks or not all(c['passed'] for c in checks):
        raise RuntimeError('Required verification has not passed.')
    for filename in ['deviations.md', 'acceptance.md']:
        if not (folder / filename).exists() or not (folder / filename).read_text(encoding='utf-8').strip():
            raise RuntimeError(f'Missing {filename}. Sol must inspect work and reconcile the journal.')
    record['state'] = 'accepted'
    record['accepted_at'] = dt.datetime.now(dt.timezone.utc).isoformat()
    save(folder / 'run.json', record)
    print('Accepted after checks and orchestrator report. This command cannot prove semantic correctness.')
    return 0

def start(root, args):
    prompt_path = BASE / 'prompts' / {'docs': '01-document-project.md', 'orchestrate': '03-orchestrate.md',
                                     'resume': '04-resume.md', 'accept': '05-accept.md'}[args.mode]
    prompt = prompt_path.read_text(encoding='utf-8')
    prompt = f'Project root: {root}\nToolkit root: {BASE}\n\n' + prompt
    if args.request:
        prompt += '\n\nHuman task:\n' + Path(args.request).read_text(encoding='utf-8-sig')
    argv = [executable('codex'), '-C', str(root), '-m', SETTINGS['orchestrator']['model'],
            '-c', f'model_reasoning_effort="{SETTINGS["orchestrator"]["effort"]}"', prompt]
    # Orchestrator uses the user's own approval/sandbox policy; worker delegate is full-access.
    return run(argv, cwd=root).returncode

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', help='Optional test/worktree root; default is the parent of this toolkit.')
    subs = parser.add_subparsers(dest='command', required=True)
    for command in ['bootstrap', 'doctor']:
        subs.add_parser(command)
    subs.add_parser('test')
    start_parser = subs.add_parser('start')
    start_parser.add_argument('mode', choices=['docs', 'orchestrate', 'resume', 'accept'])
    start_parser.add_argument('--request', help='UTF-8 file containing the user task')
    spec_parser = subs.add_parser('openspec')
    spec_parser.add_argument('arguments', nargs=argparse.REMAINDER)
    porch_parser = subs.add_parser('porch')
    porch_parser.add_argument('arguments', nargs=argparse.REMAINDER)
    task = subs.add_parser('task')
    task.add_argument('action', choices=['new', 'launch', 'status', 'events', 'steer', 'collect', 'cancel', 'check', 'accept'])
    task.add_argument('name')
    task.add_argument('--file')
    task.add_argument('--timeout', type=int, default=45)
    raw = sys.argv[1:]
    command_index = 0
    while command_index < len(raw):
        if raw[command_index] == '--root':
            command_index += 2
        elif raw[command_index].startswith('--root='):
            command_index += 1
        else:
            break
    if command_index < len(raw) and raw[command_index] in ['porch', 'openspec']:
        args = parser.parse_args(raw[:command_index + 1])
        args.arguments = raw[command_index + 1:]
    else:
        args = parser.parse_args(raw)
    root = root_for(args)
    if args.command == 'bootstrap': return bootstrap(root)
    if args.command == 'doctor': return doctor(root)
    if args.command == 'test':
        env = runtime_env(root)
        for script in [BASE / 'scripts/test_integration.py',
                       BASE / 'vendor/pragmatic-orchestration/scripts/tests/platform_test.py']:
            result = run([sys.executable, str(script)], cwd=root, env=env)
            if result.returncode:
                return result.returncode
        return 0
    if args.command == 'start': return start(root, args)
    if args.command == 'openspec': return openspec(root, args.arguments).returncode
    if args.command == 'porch': return porch(root, args.arguments).returncode
    if args.action == 'new': return new_task(root, args.name)
    if args.action == 'launch': return launch_task(root, args.name)
    if args.action == 'check': return check_task(root, args.name)
    if args.action == 'accept': return accept_task(root, args.name)
    return control_task(root, args)

if __name__ == '__main__':
    try:
        sys.exit(main())
    except (RuntimeError, FileNotFoundError, json.JSONDecodeError, subprocess.TimeoutExpired) as exc:
        print(f'ERROR: {exc}', file=sys.stderr)
        sys.exit(1)
