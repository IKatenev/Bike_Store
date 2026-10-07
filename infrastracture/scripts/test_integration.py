#!/usr/bin/env python3
"""Offline integration checks; no agent/model calls. Run after npm dependency installation."""
from pathlib import Path
import hashlib
import importlib.util
import json
import os
import shutil
import subprocess
import sys
import time
import unittest

BASE = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('infra', BASE / 'scripts/infra.py')
infra = importlib.util.module_from_spec(spec)
spec.loader.exec_module(infra)

class IntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.scratch = BASE / '.runtime' / ('integration-' + str(time.time_ns()))
        cls.project = cls.scratch / 'Целевой проект с пробелами'
        cls.bundle = cls.project / 'infrastracture'
        cls.project.mkdir(parents=True)
        shutil.copytree(BASE, cls.bundle,
                        ignore=shutil.ignore_patterns('.runtime', '__pycache__', '*.pyc'))
        (cls.project / 'AGENTS.md').write_text('# Existing project instruction\nKeep this original text.\n', encoding='utf-8')
        (cls.project / 'openspec').mkdir()
        (cls.project / 'openspec/config.yaml').write_text('schema: spec-driven\ncontext: Preserve existing context\n', encoding='utf-8')
        (cls.project / 'openspec/specs/keep').mkdir(parents=True)
        (cls.project / 'openspec/specs/keep/spec.md').write_text('Existing specification must survive.\n', encoding='utf-8')
        cls.cli = cls.bundle / 'scripts/infra.py'
        cls.env = dict(os.environ, PYTHONUTF8='1', PYTHONDONTWRITEBYTECODE='1')

    def command(self, *arguments):
        return subprocess.run([sys.executable, str(self.cli), *arguments], cwd=self.scratch,
                              env=self.env, encoding='utf-8', capture_output=True, timeout=60)

    def test_01_bootstrap_preserves_existing_project_and_is_repeatable(self):
        for _ in range(2):
            result = self.command('bootstrap')
            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        instructions = (self.project / 'AGENTS.md').read_text(encoding='utf-8')
        self.assertIn('Keep this original text.', instructions)
        self.assertEqual(instructions.count('<!-- local-ai-infrastracture:start -->'), 1)
        self.assertIn('`infrastracture/`', instructions)
        self.assertEqual((self.project / 'openspec/config.yaml').read_text(encoding='utf-8'),
                         'schema: spec-driven\ncontext: Preserve existing context\n')
        self.assertEqual((self.project / 'openspec/specs/keep/spec.md').read_text(encoding='utf-8'),
                         'Existing specification must survive.\n')
        self.assertTrue((self.project / '.agents/skills/local-project-orchestrate/SKILL.md').exists())
        self.assertTrue((self.project / '.opencode/skills/openspec-apply-change/SKILL.md').exists())

    def test_02_porch_works_after_relocation_with_spaces_and_cyrillic(self):
        result = self.command('porch', '--list-agents')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('openrouter/deepseek/deepseek-v4.1-flash', result.stdout)
        self.assertIn('gpt-6.1-sol', result.stdout)

    def test_03_task_launch_rejects_unfinished_contract(self):
        self.assertEqual(self.command('task', 'new', 'unfinished-task').returncode, 0)
        result = self.command('task', 'launch', 'unfinished-task')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('status must be ready', result.stderr)
        self.assertFalse((self.project / 'docs/ai/tasks/unfinished-task/run.json').exists())

    def test_04_task_id_cannot_escape_task_directory(self):
        result = self.command('task', 'new', '../escaped-task')
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse((self.project / 'docs/ai/escaped-task').exists())

    def test_05_acceptance_rejects_failed_checks_and_missing_journal(self):
        folder = self.project / 'docs/ai/tasks/failed-checks'
        folder.mkdir()
        (folder / 'run.json').write_text(json.dumps({'state': 'completed'}), encoding='utf-8')
        (folder / 'checks.json').write_text(json.dumps({'checks': [{'passed': False}]}), encoding='utf-8')
        result = self.command('task', 'accept', 'failed-checks')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('verification has not passed', result.stderr)
        (folder / 'checks.json').write_text(json.dumps({'checks': [{'passed': True}]}), encoding='utf-8')
        result = self.command('task', 'accept', 'failed-checks')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Missing deviations.md', result.stderr)

    def test_06_modified_existing_skill_is_preserved(self):
        skill = self.project / '.agents/skills/bug-fix-protocol/SKILL.md'
        skill.write_text(skill.read_text(encoding='utf-8') + '\nLOCAL CUSTOMIZATION\n', encoding='utf-8')
        before = skill.read_bytes()
        result = self.command('bootstrap')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('Conflicting skill', result.stderr)
        self.assertEqual(skill.read_bytes(), before)

    def test_07_vendor_checksums(self):
        manifest = json.loads((BASE / 'config/vendor-sha256.json').read_text(encoding='utf-8'))
        for rel, expected in manifest.items():
            self.assertEqual(hashlib.sha256((BASE / 'vendor' / rel).read_bytes()).hexdigest(), expected, rel)

    def test_08_fresh_project_gets_workflow_context(self):
        fresh = self.scratch / 'fresh-project'
        fresh.mkdir()
        result = self.command('--root', str(fresh), 'bootstrap')
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        config = (fresh / 'openspec/config.yaml').read_text(encoding='utf-8')
        self.assertIn('GPT-6.1 Sol', config)
        self.assertIn('DeepSeek v4.1 Flash', config)

if __name__ == '__main__':
    unittest.main(verbosity=2)
