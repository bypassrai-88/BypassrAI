# If `git push` fails with HTTP 400 / "unexpected disconnect"

Your push is ~2 MB (includes a large favicon in history). Try in order:

## 1. Increase Git HTTP buffer (run in project folder)

```bash
cd /Users/connoradams/Desktop/BypassrAI
git config http.postBuffer 524288000
git push origin main
```

## 2. If it still fails: push via SSH instead of HTTPS

```bash
git remote -v
# If it shows https://github.com/..., switch to SSH:
git remote set-url origin git@github.com:bypassrai-88/BypassrAI.git
git push origin main
```

(You need SSH keys set up with GitHub for this.)

## 3. If still failing: push in smaller chunks

Push one commit at a time (replace with your actual commit hashes if needed):

```bash
git push origin 94b0854:main   # first commit
git push origin 69f1922:main   # second
git push origin 6de13ed:main   # third
git push origin main           # fourth (sitemap)
```

Or push with a shallow buffer (sometimes helps with flaky connections):

```bash
git config http.postBuffer 524288000
git config http.lowSpeedLimit 0
git config http.lowSpeedTime 999999
git push origin main
```
