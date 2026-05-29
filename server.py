import os
import json
import hashlib
import uuid
from http.server import SimpleHTTPRequestHandler
import socketserver

PORT = 8000
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
USERS_FILE = os.path.join(DATA_DIR, 'users.json')
CLAIMS_FILE = os.path.join(DATA_DIR, 'claims.json')

# Session store: { token: { "username": ..., "role": ..., "name": ... } }
SESSIONS = {}

def get_sha256(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()

def init_databases():
    if not os.path.exists(DATA_DIR):
        os.makedirs(DATA_DIR)

    # Initialize users.json
    if not os.path.exists(USERS_FILE):
        default_users = [
            {
                "username": "admin",
                "password_hash": get_sha256("admin123"),
                "role": "admin",
                "name": "管理者"
            },
            {
                "username": "yrai",
                "password_hash": get_sha256("yrai123"),
                "role": "user",
                "name": "Y Rai"
            },
            {
                "username": "sato",
                "password_hash": get_sha256("sato123"),
                "role": "user",
                "name": "佐藤 健二"
            },
            {
                "username": "suzuki",
                "password_hash": get_sha256("suzuki123"),
                "role": "user",
                "name": "鈴木 美咲"
            }
        ]
        with open(USERS_FILE, 'w', encoding='utf-8') as f:
            json.dump(default_users, f, indent=2, ensure_ascii=False)

    # Initialize claims.json with SVG receipt dataURLs
    if not os.path.exists(CLAIMS_FILE):
        # Base64 SVGs to populate initial claims
        flight_svg = "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"600\" height=\"340\" viewBox=\"0 0 600 340\"><rect width=\"600\" height=\"340\" rx=\"16\" fill=\"%231e1b4b\" stroke=\"%23818cf8\" stroke-width=\"2\"/><rect x=\"25\" y=\"25\" width=\"550\" height=\"290\" rx=\"8\" fill=\"none\" stroke=\"%234f46e5\" stroke-width=\"1.5\"/><text x=\"45\" y=\"60\" font-family=\"'Outfit', sans-serif\" font-size=\"20\" font-weight=\"800\" fill=\"%23a5b4fc\">JAPAN AIRLINES</text><text x=\"480\" y=\"60\" font-family=\"'Noto Sans JP', sans-serif\" font-size=\"12\" font-weight=\"700\" fill=\"%23818cf8\">領収明細書</text><text x=\"50\" y=\"115\" font-family=\"sans-serif\" font-size=\"12\" fill=\"%2394a3b8\">FLIGHT</text><text x=\"50\" y=\"145\" font-family=\"'Outfit', sans-serif\" font-size=\"26\" font-weight=\"800\" fill=\"%23ffffff\">HND</text><text x=\"50\" y=\"170\" font-family=\"'Noto Sans JP', sans-serif\" font-size=\"12\" fill=\"%2394a3b8\">東京（羽田空港）</text><text x=\"140\" y=\"140\" font-family=\"sans-serif\" font-size=\"24\" fill=\"%23818cf8\">✈</text><text x=\"210\" y=\"115\" font-family=\"sans-serif\" font-size=\"12\" fill=\"%2394a3b8\">TO</text><text x=\"210\" y=\"145\" font-family=\"'Outfit', sans-serif\" font-size=\"26\" font-weight=\"800\" fill=\"%23ffffff\">FUK</text><text x=\"210\" y=\"170\" font-family=\"'Noto Sans JP', sans-serif\" font-size=\"12\" fill=\"%2394a3b8\">福岡（福岡空港）</text><text x=\"360\" y=\"115\" font-family=\"sans-serif\" font-size=\"11\" fill=\"%2394a3b8\">搭乗日 / DATE</text><text x=\"360\" y=\"135\" font-family=\"'Outfit', sans-serif\" font-size=\"15\" font-weight=\"600\" fill=\"%23ffffff\">2026/05/18</text><text x=\"360\" y=\"175\" font-family=\"sans-serif\" font-size=\"11\" fill=\"%2394a3b8\">便名 / FLIGHT NO</text><text x=\"360\" y=\"195\" font-family=\"'Outfit', sans-serif\" font-size=\"15\" font-weight=\"600\" fill=\"%23ffffff\">JAL 315</text><line x1=\"50\" y1=\"225\" x2=\"550\" y2=\"225\" stroke=\"%234f46e5\" stroke-dasharray=\"5,5\"/><text x=\"50\" y=\"270\" font-family=\"'Noto Sans JP', sans-serif\" font-size=\"14\" fill=\"%23cbd5e1\">精算代金合計 / TOTAL FARE</text><text x=\"50\" y=\"295\" font-family=\"'Outfit', sans-serif\" font-size=\"24\" font-weight=\"800\" fill=\"%23a5b4fc\">¥ 28,400-</text><text x=\"400\" y=\"270\" font-family=\"'Noto Sans JP', sans-serif\" font-size=\"12\" fill=\"%2394a3b8\">決済方法：クレジットカード</text><text x=\"400\" y=\"290\" font-family=\"'Noto Sans JP', sans-serif\" font-size=\"12\" fill=\"%2394a3b8\">旅客名：Y RAI 様</text></svg>"
        shinkansen_svg = "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"600\" height=\"340\" viewBox=\"0 0 600 340\"><rect width=\"600\" height=\"340\" rx=\"16\" fill=\"%23f0fbf6\" stroke=\"%23a3e635\" stroke-width=\"3\"/><rect x=\"20\" y=\"20\" width=\"560\" height=\"300\" rx=\"8\" fill=\"none\" stroke=\"%2386efac\" stroke-width=\"1.5\" stroke-dasharray=\"8,4\"/><text x=\"40\" y=\"55\" font-family=\"'Noto Sans JP', sans-serif\" font-size=\"14\" font-weight=\"700\" fill=\"%23166534\">新幹線指定席特急券・乗車券</text><text x=\"500\" y=\"55\" font-family=\"monospace\" font-size=\"14\" font-weight=\"700\" fill=\"%23166534\">JR乗車券</text><text x=\"60\" y=\"120\" font-family=\"'Noto Sans JP', sans-serif\" font-size=\"28\" font-weight=\"800\" fill=\"%231e293b\">東京都区内</text><text x=\"210\" y=\"112\" font-family=\"sans-serif\" font-size=\"20\" fill=\"%2364748b\">➡</text><text x=\"290\" y=\"120\" font-family=\"'Noto Sans JP', sans-serif\" font-size=\"28\" font-weight=\"800\" fill=\"%231e293b\">京都市内</text><text x=\"60\" y=\"170\" font-family=\"'Noto Sans JP', sans-serif\" font-size=\"14\" fill=\"%23334155\">2026年 05月20日 08:00発</text><text x=\"60\" y=\"195\" font-family=\"'Noto Sans JP', sans-serif\" font-size=\"14\" fill=\"%23334155\">のぞみ 15号 (1号車 10番 C席)</text><rect x=\"60\" y=\"225\" width=\"200\" height=\"40\" rx=\"6\" fill=\"%23dcfce7\" stroke=\"%2386efac\" stroke-width=\"1\"/><text x=\"75\" y=\"252\" font-family=\"'Outfit', sans-serif\" font-size=\"20\" font-weight=\"800\" fill=\"%2315803d\">¥ 13,910-</text><text x=\"270\" y=\"250\" font-family=\"'Noto Sans JP', sans-serif\" font-size=\"12\" fill=\"%2364748b\">（内訳：乗車券 ¥8,360 特急券 ¥5,550）</text><rect x=\"420\" y=\"200\" width=\"120\" height=\"40\" fill=\"none\" stroke=\"%231e293b\" stroke-width=\"2\" stroke-dasharray=\"2,3,4,1,2,4,1,3,2\"/><text x=\"440\" y=\"260\" font-family=\"monospace\" font-size=\"10\" fill=\"%2364748b\">1042-8829-0034</text><path d=\"M 0 170 L 20 170 M 580 170 L 600 170\" stroke=\"%2386efac\" stroke-width=\"3\"/></svg>"
        highway_svg = "data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"600\" height=\"340\" viewBox=\"0 0 600 340\"><rect width=\"600\" height=\"340\" rx=\"16\" fill=\"%231e293b\" stroke=\"%2334d399\" stroke-width=\"2\"/><rect x=\"20\" y=\"20\" width=\"560\" height=\"300\" rx=\"8\" fill=\"none\" stroke=\"%23475569\" stroke-width=\"1\"/><text x=\"210\" y=\"55\" font-family=\"'Noto Sans JP', sans-serif\" font-size=\"20\" font-weight=\"800\" fill=\"%2334d399\" letter-spacing=\"4\">ETC料金領収書</text><text x=\"480\" y=\"50\" font-family=\"'Noto Sans JP', sans-serif\" font-size=\"11\" fill=\"%2394a3b8\">東日本高速道路</text><text x=\"50\" y=\"110\" font-family=\"'Noto Sans JP', sans-serif\" font-size=\"14\" fill=\"%2394a3b8\">利用日時：</text><text x=\"140\" y=\"110\" font-family=\"'Outfit', sans-serif\" font-size=\"14\" font-weight=\"600\" fill=\"%23ffffff\">2026年 05月22日 18:24</text><text x=\"50\" y=\"145\" font-family=\"'Noto Sans JP', sans-serif\" font-size=\"14\" fill=\"%2394a3b8\">入場ＩＣ：</text><text x=\"140\" y=\"145\" font-family=\"/span/span\" font-size=\"16\" font-weight=\"700\" fill=\"%23ffffff\">用賀IC (首都高速)</text><text x=\"50\" y=\"180\" font-family=\"'Noto Sans JP', sans-serif\" font-size=\"14\" fill=\"%2394a3b8\">出場ＩＣ：</text><text x=\"140\" y=\"180\" font-family=\"'Noto Sans JP', sans-serif\" font-size=\"16\" font-weight=\"700\" fill=\"%23ffffff\">厚木IC (東名高速)</text><text x=\"50\" y=\"215\" font-family=\"'Noto Sans JP', sans-serif\" font-size=\"14\" fill=\"%2394a3b8\">車両区分：</text><text x=\"140\" y=\"215\" font-family=\"'Noto Sans JP', sans-serif\" font-size=\"14\" fill=\"%23ffffff\">普通車 (ETC車載器)</text><line x1=\"50\" y1=\"240\" x2=\"550\" y2=\"240\" stroke=\"%23475569\" stroke-width=\"1\"/><text x=\"50\" y=\"285\" font-family=\"'Noto Sans JP', sans-serif\" font-size=\"18\" font-weight=\"700\" fill=\"%2334d399\">利用料金：</text><text x=\"150\" y=\"290\" font-family=\"'Outfit', sans-serif\" font-size=\"28\" font-weight=\"800\" fill=\"%2334d399\">¥ 2,800</text><text x=\"430\" y=\"285\" font-family=\"'Noto Sans JP', sans-serif\" font-size=\"12\" fill=\"%2394a3b8\">ETCクレジットカード決済</text></svg>"

        default_claims = [
            {
                "id": "claim-101",
                "date": "2026-05-18",
                "title": "福岡営業所定例監査役員訪問（福岡出張・復路）",
                "category": "flight",
                "amount": 28400,
                "status": "approved",
                "applicantName": "Y Rai",
                "purpose": "",
                "legs": [
                    { "id": "leg-101-1", "type": "flight", "from": "羽田空港(HND)", "to": "福岡空港(FUK)", "amount": 28400, "remark": "JAL315便 出張", "receiptImage": flight_svg }
                ]
            },
            {
                "id": "claim-102",
                "date": "2026-05-20",
                "title": "京都クライアント定例ミーティング出席（京都出張・往路）",
                "category": "shinkansen",
                "amount": 13910,
                "status": "pending",
                "applicantName": "Y Rai",
                "purpose": "",
                "legs": [
                    { "id": "leg-102-1", "type": "shinkansen", "from": "東京駅", "to": "京都駅", "amount": 13910, "remark": "のぞみ 指定席", "receiptImage": shinkansen_svg }
                ]
            },
            {
                "id": "claim-103",
                "date": "2026-05-22",
                "title": "伊勢原新規顧客向けデモンストレーション実施（神奈川クライアント訪問）",
                "category": "highway",
                "amount": 3260,
                "status": "pending",
                "applicantName": "佐藤 健二",
                "purpose": "",
                "legs": [
                    { "id": "leg-103-1", "type": "subway", "from": "代々木公園駅", "to": "用賀駅", "amount": 460, "remark": "小田急線乗り継ぎ" },
                    { "id": "leg-103-2", "type": "highway", "from": "用賀IC", "to": "厚木IC", "amount": 2800, "remark": "社用車 ETC", "receiptImage": highway_svg }
                ]
            },
            {
                "id": "claim-104",
                "date": "2026-05-25",
                "title": "六本木オフィスクライアント契約締結商談（六本木オフィス移動）",
                "category": "subway",
                "amount": 280,
                "status": "approved",
                "applicantName": "鈴木 美咲",
                "purpose": "",
                "legs": [
                    { "id": "leg-104-1", "type": "subway", "from": "新宿駅", "to": "麻布十番駅", "amount": 220, "remark": "都営大江戸線" },
                    { "id": "leg-104-2", "type": "subway", "from": "麻布十番駅", "to": "六本木一丁目駅", "amount": 60, "remark": "東京メトロ南北線" }
                ]
            }
        ]
        with open(CLAIMS_FILE, 'w', encoding='utf-8') as f:
            json.dump(default_claims, f, indent=2, ensure_ascii=False)

class CustomAPIRequestHandler(SimpleHTTPRequestHandler):

    def log_message(self, format, *args):
        # Optional: Suppress default request logger to keep stdout clean
        pass

    def send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def send_error_json(self, message, status=400):
        self.send_json({"error": message}, status)

    def verify_token(self):
        auth_header = self.headers.get('Authorization')
        if not auth_header:
            return None
        
        token = auth_header
        if token.startswith('Bearer '):
            token = token[7:]
            
        return SESSIONS.get(token)

    def do_OPTIONS(self):
        # Support CORS preflight
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.end_headers()

    def do_GET(self):
        # Route API requests
        if self.path.startswith('/api/claims'):
            user_session = self.verify_token()
            if not user_session:
                self.send_error_json("認証されていません", 401)
                return

            try:
                with open(CLAIMS_FILE, 'r', encoding='utf-8') as f:
                    claims = json.load(f)
            except Exception as e:
                claims = []

            # Role-based query restriction
            if user_session["role"] == "admin":
                # Admin can see all claims
                self.send_json(claims)
            else:
                # Regular user can only see their own claims matching their display name
                user_claims = [c for c in claims if c.get("applicantName") == user_session["name"]]
                self.send_json(user_claims)
            return

        elif self.path == '/api/users':
            user_session = self.verify_token()
            if not user_session:
                self.send_error_json("認証されていません", 401)
                return

            if user_session["role"] != "admin":
                self.send_error_json("管理者権限が必要です", 403)
                return

            try:
                with open(USERS_FILE, 'r', encoding='utf-8') as f:
                    users = json.load(f)
            except Exception:
                users = []

            # Exclude hash from response for security
            sanitized_users = []
            for u in users:
                sanitized_users.append({
                    "username": u["username"],
                    "name": u.get("name", ""),
                    "role": u.get("role", "user")
                })

            self.send_json(sanitized_users)
            return

        # Route static files through default handler
        super().do_GET()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        # Load request payload
        try:
            req_data = json.loads(post_data.decode('utf-8'))
        except Exception:
            req_data = {}

        # 1. Login Endpoint
        if self.path == '/api/login':
            username = req_data.get('username')
            password = req_data.get('password')

            if not username or not password:
                self.send_error_json("IDとパスワードを入力してください", 400)
                return

            # Check users
            try:
                with open(USERS_FILE, 'r', encoding='utf-8') as f:
                    users = json.load(f)
            except Exception:
                users = []

            pw_hash = get_sha256(password)
            matched_user = None
            for u in users:
                if u["username"] == username and u["password_hash"] == pw_hash:
                    matched_user = u
                    break

            if matched_user:
                # Generate token
                token = str(uuid.uuid4())
                session_data = {
                    "username": matched_user["username"],
                    "role": matched_user["role"],
                    "name": matched_user["name"]
                }
                SESSIONS[token] = session_data
                self.send_json({
                    "token": token,
                    "username": matched_user["username"],
                    "name": matched_user["name"],
                    "role": matched_user["role"]
                })
            else:
                self.send_error_json("IDまたはパスワードが正しくありません", 401)
            return

        # Token check for secure APIs
        user_session = self.verify_token()
        if not user_session:
            self.send_error_json("認証されていません", 401)
            return

        # 2. Add / Update Claim Endpoint
        if self.path == '/api/claims/save':
            claim_data = req_data.get('claim')
            if not claim_data:
                self.send_error_json("申請データが空です", 400)
                return

            # Enforce name match for regular users (Prevent editing other applicant's name)
            if user_session["role"] != "admin":
                claim_data["applicantName"] = user_session["name"]

            try:
                with open(CLAIMS_FILE, 'r', encoding='utf-8') as f:
                    claims = json.load(f)
            except Exception:
                claims = []

            # If existing ID, update. Else, assign new ID and push.
            claim_id = claim_data.get('id')
            if claim_id:
                # Find and replace
                updated = False
                for i, c in enumerate(claims):
                    # Regular user can only edit their own claims
                    if c["id"] == claim_id:
                        if user_session["role"] != "admin" and c.get("applicantName") != user_session["name"]:
                            self.send_error_json("権限がありません", 403)
                            return
                        claims[i] = claim_data
                        updated = True
                        break
                if not updated:
                    claims.append(claim_data)
            else:
                # Assign new ID
                new_id = f"claim-{int(uuid.uuid1().time / 10000)}"
                claim_data["id"] = new_id
                claims.append(claim_data)

            # Persist to database
            try:
                with open(CLAIMS_FILE, 'w', encoding='utf-8') as f:
                    json.dump(claims, f, indent=2, ensure_ascii=False)
                self.send_json({"success": True, "claim": claim_data})
            except Exception as e:
                self.send_error_json(f"データベースの保存に失敗しました: {str(e)}", 500)
            return

        # 3. Approve Claim Endpoint (Admin Only)
        if self.path == '/api/claims/approve':
            if user_session["role"] != "admin":
                self.send_error_json("管理者権限が必要です", 403)
                return

            claim_id = req_data.get('id')
            if not claim_id:
                self.send_error_json("対象のIDが指定されていません", 400)
                return

            try:
                with open(CLAIMS_FILE, 'r', encoding='utf-8') as f:
                    claims = json.load(f)
            except Exception:
                claims = []

            updated = False
            for c in claims:
                if c["id"] == claim_id:
                    c["status"] = "approved"
                    updated = True
                    break

            if updated:
                with open(CLAIMS_FILE, 'w', encoding='utf-8') as f:
                    json.dump(claims, f, indent=2, ensure_ascii=False)
                self.send_json({"success": True})
            else:
                self.send_error_json("該当する申請が見つかりません", 404)
            return

        # 4. Delete Claim Endpoint
        if self.path == '/api/claims/delete':
            claim_id = req_data.get('id')
            if not claim_id:
                self.send_error_json("対象のIDが指定されていません", 400)
                return

            try:
                with open(CLAIMS_FILE, 'r', encoding='utf-8') as f:
                    claims = json.load(f)
            except Exception:
                claims = []

            # Verify ownership if user is not admin
            target_claim = next((c for c in claims if c["id"] == claim_id), None)
            if not target_claim:
                self.send_error_json("該当する申請が見つかりません", 404)
                return

            if user_session["role"] != "admin" and target_claim.get("applicantName") != user_session["name"]:
                self.send_error_json("他人の申請データは削除できません", 403)
                return

            claims = [c for c in claims if c["id"] != claim_id]

            with open(CLAIMS_FILE, 'w', encoding='utf-8') as f:
                json.dump(claims, f, indent=2, ensure_ascii=False)
            self.send_json({"success": True})
            return

        # 5. Save/Update User Endpoint (Admin Only)
        if self.path == '/api/users/save':
            if user_session["role"] != "admin":
                self.send_error_json("管理者権限が必要です", 403)
                return

            user_data = req_data.get('user')
            if not user_data or not user_data.get('username') or not user_data.get('name'):
                self.send_error_json("IDと表示名は必須です", 400)
                return

            username = user_data['username'].strip().lower()
            name = user_data['name'].strip()
            role = user_data.get('role', 'user')
            password = user_data.get('password')

            try:
                with open(USERS_FILE, 'r', encoding='utf-8') as f:
                    users = json.load(f)
            except Exception:
                users = []

            # Find matching user
            existing_user = None
            for u in users:
                if u["username"] == username:
                    existing_user = u
                    break

            if existing_user:
                # Edit
                existing_user["name"] = name
                existing_user["role"] = role
                if password: # Change password
                    existing_user["password_hash"] = get_sha256(password)
            else:
                # Create
                if not password:
                    self.send_error_json("新規ユーザー登録にはパスワードが必要です", 400)
                    return
                new_user = {
                    "username": username,
                    "password_hash": get_sha256(password),
                    "role": role,
                    "name": name
                }
                users.append(new_user)

            try:
                with open(USERS_FILE, 'w', encoding='utf-8') as f:
                    json.dump(users, f, indent=2, ensure_ascii=False)
                self.send_json({"success": True})
            except Exception as e:
                self.send_error_json(f"データベースの保存に失敗しました: {str(e)}", 500)
            return

        # 6. Delete User Endpoint (Admin Only)
        if self.path == '/api/users/delete':
            if user_session["role"] != "admin":
                self.send_error_json("管理者権限が必要です", 403)
                return

            username = req_data.get('username')
            if not username:
                self.send_error_json("対象のユーザーIDが指定されていません", 400)
                return

            if username == "admin":
                self.send_error_json("デフォルトの管理者アカウント 'admin' は削除できません", 400)
                return

            try:
                with open(USERS_FILE, 'r', encoding='utf-8') as f:
                    users = json.load(f)
            except Exception:
                users = []

            user_exists = any(u["username"] == username for u in users)
            if not user_exists:
                self.send_error_json("該当するユーザーが見つかりません", 404)
                return

            users = [u for u in users if u["username"] != username]

            try:
                with open(USERS_FILE, 'w', encoding='utf-8') as f:
                    json.dump(users, f, indent=2, ensure_ascii=False)
                self.send_json({"success": True})
            except Exception as e:
                self.send_error_json(f"データベースの保存に失敗しました: {str(e)}", 500)
            return

        self.send_error_json("無効なAPIエンドポイントです", 404)

if __name__ == '__main__':
    # Initialize JSON files
    init_databases()
    
    # Run simple multithreaded TCP server
    class ThreadingHTTPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
        allow_reuse_address = True

    server_address = ('0.0.0.0', PORT)
    httpd = ThreadingHTTPServer(server_address, CustomAPIRequestHandler)
    print(f"SmartFare Custom API Server is running on port {PORT}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Server...")
        httpd.server_close()
