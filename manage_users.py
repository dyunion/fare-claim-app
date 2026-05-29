#!/usr/bin/env python3
import os
import json
import hashlib
import getpass
import sys

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')

def get_sha256(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def load_users():
    if not os.path.exists(USERS_FILE):
        return []
    try:
        with open(USERS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return []

def save_users(users):
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)
    with open(USERS_FILE, 'w', encoding='utf-8') as f:
        json.dump(users, f, indent=2, ensure_ascii=False)

def print_help():
    print("=== SmartFare ユーザー管理ツール ===")
    print("使用方法:")
    print("  python3 manage_users.py list               : ユーザー一覧を表示")
    print("  python3 manage_users.py add <ID>           : ユーザーを新規追加")
    print("  python3 manage_users.py passwd <ID>        : パスワードの変更")
    print("  python3 manage_users.py delete <ID>        : ユーザーの削除")
    print("====================================")

def list_users():
    users = load_users()
    if not users:
        print("登録されているユーザーはいません。")
        return
    
    print(f"{'ユーザーID':<15} | {'表示名 (氏名)':<15} | {'権限 (ロール)':<15}")
    print("-" * 55)
    for u in users:
        role_label = "管理者" if u.get("role") == "admin" else "一般ユーザー"
        print(f"{u['username']:<15} | {u.get('name', 'N/A'):<15} | {role_label:<15}")

def add_user(username):
    users = load_users()
    
    # Check duplicate
    for u in users:
        if u["username"] == username:
            print(f"エラー: ユーザーID '{username}' は既に登録されています。")
            return

    # Prompt details
    name = input("表示名（氏名。例: 山田 太郎）: ").strip()
    if not name:
        print("エラー: 表示名は必須です。")
        return

    role_input = input("ロール（admin: 管理者 / user: 一般ユーザー）[default: user]: ").strip().lower()
    role = "admin" if role_input in ["admin", "a"] else "user"

    password = getpass.getpass("パスワードを設定してください: ")
    if not password:
        print("エラー: パスワードを空にすることはできません。")
        return
        
    confirm = getpass.getpass("確認のためもう一度入力してください: ")
    if password != confirm:
        print("エラー: パスワードが一致しません。")
        return

    new_user = {
        "username": username,
        "password_hash": get_sha256(password),
        "role": role,
        "name": name
    }
    users.append(new_user)
    save_users(users)
    print(f"ユーザー '{username}'（{name}）を正常に登録しました！")

def change_password(username):
    users = load_users()
    matched_user = None
    for u in users:
        if u["username"] == username:
            matched_user = u
            break
            
    if not matched_user:
        print(f"エラー: ユーザーID '{username}' は見つかりません。")
        return

    password = getpass.getpass(f"'{username}' の新しいパスワードを入力してください: ")
    if not password:
        print("エラー: パスワードを空にすることはできません。")
        return
        
    confirm = getpass.getpass("確認のためもう一度入力してください: ")
    if password != confirm:
        print("エラー: パスワードが一致しません。")
        return

    matched_user["password_hash"] = get_sha256(password)
    save_users(users)
    print(f"ユーザー '{username}' のパスワードを更新しました。")

def delete_user(username):
    if username == "admin":
        print("エラー: デフォルトの管理者アカウント 'admin' は削除できません。")
        return
        
    users = load_users()
    initial_count = len(users)
    users = [u for u in users if u["username"] != username]
    
    if len(users) == initial_count:
        print(f"エラー: ユーザーID '{username}' は見つかりません。")
        return
        
    confirm = input(f"ユーザー '{username}' を本当に削除しますか？ (y/N): ").strip().lower()
    if confirm == 'y':
        save_users(users)
        print(f"ユーザー '{username}' を削除しました。")
    else:
        print("削除をキャンセルしました。")

def main():
    if len(sys.argv) < 2:
        print_help()
        return

    action = sys.argv[1].lower()

    if action == "list":
        list_users()
    elif action == "add":
        if len(sys.argv) < 3:
            print("エラー: 追加するユーザーIDを指定してください。(例: python3 manage_users.py add yoshida)")
            return
        add_user(sys.argv[2])
    elif action == "passwd":
        if len(sys.argv) < 3:
            print("エラー: パスワードを変更するユーザーIDを指定してください。")
            return
        change_password(sys.argv[2])
    elif action == "delete":
        if len(sys.argv) < 3:
            print("エラー: 削除するユーザーIDを指定してください。")
            return
        delete_user(sys.argv[2])
    else:
        print_help()

if __name__ == "__main__":
    main()
