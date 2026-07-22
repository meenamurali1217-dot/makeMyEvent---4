"""
MakeMyEvent (Event Nest) — single-file Flask application.
All business logic lives here. HTML in templates/, assets in static/.
"""

import hashlib
import os
from functools import wraps
from werkzeug.utils import secure_filename

import mysql.connector
from flask import (
    Flask,
    flash,
    redirect,
    render_template,
    request,
    session,
    url_for,
)

app = Flask(__name__)
app.secret_key = "change-this-secret-key-in-production"

# ---------------------------------------------------------------------------
# MySQL configuration — update for your machine
# ---------------------------------------------------------------------------
# DB_CONFIG = {
#     "host": "localhost",
#     "user": "root",
#     "password": "1217@Mkvm",
#     "database": "makemyevent-1",
# }
DB_CONFIG = {
    "host": "acela.proxy.rlwy.net",
    "user": "root",
    "password": "PHXEmGdEntfMzbCCjWcZQicFhRZpWVHq",
    "database": "railway",
    "port": 17019,
}
PASSWORD_SALT = "makemyevent_salt"


# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------
def get_db():
    return mysql.connector.connect(**DB_CONFIG)


def hash_password(password):
    raw = (password + PASSWORD_SALT).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def verify_password(password, password_hash):
    return hash_password(password) == password_hash


def query_all(sql, params=None):
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    try:
        cur.execute(sql, params or ())
        rows = cur.fetchall()
        return rows
    finally:
        cur.close()
        conn.close()


def query_one(sql, params=None):
    rows = query_all(sql, params)
    return rows[0] if rows else None


def execute(sql, params=None):
    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(sql, params or ())
        conn.commit()
        last_id = cur.lastrowid
        return last_id
    except:
        conn.rollback()
        raise
    finally:
        cur.close()
        conn.close()


def init_custom_db_features():
    conn = get_db()
    cur = conn.cursor()
    try:
        # Create website_reviews table
        cur.execute("""
        CREATE TABLE IF NOT EXISTS website_reviews (
            review_id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            rating DECIMAL(3,2) NOT NULL,
            feedback TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """)
        conn.commit()

        # Add review_text to reviews
        try:
            cur.execute("ALTER TABLE reviews ADD COLUMN review_text TEXT AFTER booking_id")
            conn.commit()
        except mysql.connector.Error:
            pass

        # Add reply_text to reviews
        try:
            cur.execute("ALTER TABLE reviews ADD COLUMN reply_text TEXT AFTER review_text")
            conn.commit()
        except mysql.connector.Error:
            pass

        # Add cancellation_reason to bookings
        try:
            cur.execute("ALTER TABLE bookings ADD COLUMN cancellation_reason TEXT AFTER status")
            conn.commit()
        except mysql.connector.Error:
            pass

        # Update vendor_profiles status enum to support suspended
        try:
            cur.execute("ALTER TABLE vendor_profiles MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'suspended') DEFAULT 'pending'")
            conn.commit()
        except mysql.connector.Error:
            pass

        # Add status column to users
        try:
            cur.execute("ALTER TABLE users ADD COLUMN status ENUM('active', 'blocked') NOT NULL DEFAULT 'active'")
            conn.commit()
        except mysql.connector.Error:
            pass

        # Create notifications table
        try:
            cur.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                notification_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                message TEXT NOT NULL,
                is_read TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
            """)
            conn.commit()
        except mysql.connector.Error:
            pass
    except Exception as e:
        print("Database initialization error:", e)
    finally:
        cur.close()
        conn.close()


# Run initialization
try:
    init_custom_db_features()
except Exception as e:
    print("Database initialization trigger error:", e)


def parse_price_label(price_str):
    if not price_str:
        return 0
    price_str = str(price_str).replace("₹", "").replace(",", "").strip()
    if "L" in price_str:
        try:
            val = float(price_str.replace("L", "").strip())
            return int(val * 100000)
        except:
            pass
    if "/" in price_str:
        price_str = price_str.split("/")[0].strip()
    try:
        digits = "".join([c for c in price_str if c.isdigit() or c == "."])
        return float(digits) if digits else 0
    except:
        return 0


def get_category_slug(category_name):
    if not category_name:
        return 'wedding'
    name = str(category_name).lower().strip()
    if 'photo' in name:
        return 'photography'
    if 'decor' in name:
        return 'decoration'
    if 'cater' in name:
        return 'catering'
    if 'music' in name or 'dj' in name:
        return 'music'
    if 'makeup' in name or 'styling' in name or 'artist' in name:
        return 'makeup'
    if 'mehendi' in name:
        return 'mehendi'
    if 'light' in name:
        return 'lighting'
    if 'cake' in name or 'dessert' in name:
        return 'cake'
    if 'transport' in name:
        return 'transport'
    if 'anchor' in name or 'mc' in name:
        return 'anchoring'
    if 'security' in name:
        return 'security'
    if 'floral' in name or 'garland' in name:
        return 'floral'
    if 'booth' in name:
        return 'photobooth'
    if 'entertain' in name:
        return 'entertainment'
    
    cat_exists = query_one("SELECT slug FROM event_categories WHERE slug = %s", (name,))
    if cat_exists:
        return name
        
    return 'wedding'



# ---------------------------------------------------------------------------
# Auth decorators
# ---------------------------------------------------------------------------
def login_required(role=None):
    def decorator(view):
        @wraps(view)
        def wrapped(*args, **kwargs):
            if "user_id" not in session:
                flash("Please log in to continue.", "warning")
                return redirect(url_for("signup"))
            if role and session.get("role") != role:
                flash("You do not have permission to access that page.", "error")
                if session.get("role") == "admin":
                    return redirect(url_for("admin_dashboard"))
                if session.get("role") == "vendor":
                    return redirect(url_for("vendor_dashboard"))
                return redirect(url_for("user_home"))
            return view(*args, **kwargs)

        return wrapped

    return decorator


def set_user_session(user):
    session["user_id"] = user["user_id"]
    session["username"] = user["username"]
    session["email"] = user["email"]
    session["role"] = user["role"]
    session["profile_image"] = user.get("profile_image")


def clear_user_session():
    session.clear()


def redirect_after_login(role):
    if role == "admin":
        return redirect(url_for("admin_dashboard"))
    if role == "vendor":
        return redirect(url_for("vendor_dashboard"))
    return redirect(url_for("user_home"))


# ---------------------------------------------------------------------------
# Public routes
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    return render_template("index.html")


@app.route("/gallery")
def public_gallery():
    images = query_all(
        "SELECT * FROM gallery_images WHERE is_public = 1 ORDER BY created_at DESC"
    )
    return render_template("public/gallery.html", images=images)


@app.route("/about")
def public_about():
    return render_template("public/about.html")


# ---------------------------------------------------------------------------
# Authentication
# ---------------------------------------------------------------------------
@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        action = request.form.get("action")

        if action == "login":
            email = request.form.get("email", "").strip().lower()
            password = request.form.get("password", "")
            user = query_one(
                "SELECT user_id, username, email, password_hash, role, profile_image, status "
                "FROM users WHERE email = %s",
                (email,),
            )
            if not user or not verify_password(password, user["password_hash"]):
                flash("Invalid email or password.", "error")
                return redirect(url_for("signup"))

            if user.get("status") == "blocked":
                flash("Your account has been blocked by the admin.", "danger")
                return redirect(url_for("signup"))

            if user["role"] == "vendor":
                profile = query_one(
                    "SELECT status FROM vendor_profiles WHERE user_id = %s",
                    (user["user_id"],),
                )
                if profile:
                    if profile["status"] == "suspended":
                        flash("Your vendor account has been suspended by the admin.", "danger")
                        return redirect(url_for("signup"))
                    elif profile["status"] != "approved":
                        flash("Your vendor account is pending admin approval.", "warning")
                        return redirect(url_for("signup"))

            set_user_session(user)
            flash("Welcome back, {}!".format(user["username"]), "success")
            return redirect_after_login(user["role"])

        if action == "register":
            username = request.form.get("username", "").strip()
            email = request.form.get("email", "").strip().lower()
            password = request.form.get("password", "")
            confirm = request.form.get("confirm_password", "")
            address = request.form.get("address", "").strip()
            contact = request.form.get("contact", "").strip()
            gender = request.form.get("gender")
            age = request.form.get("age")

            if password != confirm:
                flash("Passwords do not match.", "error")
                return redirect(url_for("signup"))

            if query_one("SELECT user_id FROM users WHERE email = %s", (email,)):
                flash("Email is already registered.", "error")
                return redirect(url_for("signup"))

            execute(
                "INSERT INTO users (username, email, password_hash, address, contact, gender, age, role) "
                "VALUES (%s, %s, %s, %s, %s, %s, %s, 'user')",
                (
                    username,
                    email,
                    hash_password(password),
                    address,
                    contact,
                    gender,
                    age or None,
                ),
            )
            user = query_one(
                "SELECT user_id, username, email, role, profile_image FROM users WHERE email = %s",
                (email,),
            )
            set_user_session(user)
            # flash("Registration successful!", "success")
            return redirect(url_for("user_home"))

    return render_template("auth/signup.html")


@app.route("/logout")
def logout():
    clear_user_session()
    flash("You have been logged out.", "info")
    return redirect(url_for("index"))


@app.route("/change-password", methods=["GET", "POST"])
@login_required()
def change_password():
    role = session.get("role")
    if role == "admin":
        dashboard_url = url_for("admin_dashboard")
    elif role == "vendor":
        dashboard_url = url_for("vendor_dashboard")
    else:
        dashboard_url = url_for("user_home")

    if request.method == "POST":
        current_password = request.form.get("current_password")
        new_password = request.form.get("new_password")
        confirm_password = request.form.get("confirm_password")

        user_id = session["user_id"]
        user = query_one("SELECT password_hash FROM users WHERE user_id = %s", (user_id,))

        if not user or not verify_password(current_password, user["password_hash"]):
            flash("Incorrect current password.", "error")
            return render_template("auth/change_password.html", dashboard_url=dashboard_url)

        if new_password != confirm_password:
            flash("New passwords do not match.", "error")
            return render_template("auth/change_password.html", dashboard_url=dashboard_url)

        execute(
            "UPDATE users SET password_hash = %s WHERE user_id = %s",
            (hash_password(new_password), user_id)
        )
        flash("Password changed successfully.", "success")
        return redirect(dashboard_url)

    return render_template("auth/change_password.html", dashboard_url=dashboard_url)



@app.route("/vendor-register", methods=["POST"])
def vendor_register():
    full_name = request.form.get("full_name", "").strip()
    business_name = request.form.get("business_name", "").strip()
    email = request.form.get("email", "").strip().lower()
    phone = request.form.get("phone", "").strip()
    service_type = request.form.get("service_type", "").strip()
    city = request.form.get("city", "").strip()

    if not all([full_name, business_name, email, phone, service_type, city]):
        flash("Please fill in all vendor registration fields.", "error")
        return redirect(request.referrer or url_for("index"))

    execute(
        "INSERT INTO vendor_registration_requests "
        "(full_name, business_name, email, phone, service_type, city) "
        "VALUES (%s, %s, %s, %s, %s, %s)",
        (full_name, business_name, email, phone, service_type, city),
    )
    flash("Vendor request submitted. Admin will review and contact you.", "success")
    return redirect(request.referrer or url_for("index"))


# ---------------------------------------------------------------------------
# User portal
# ---------------------------------------------------------------------------
@app.route("/user/home")
@login_required("user")
def user_home():
    categories = query_all("SELECT * FROM event_categories ORDER BY category_id")
    return render_template("user/home.html", categories=categories, user=session)


@app.route("/user/services")
@login_required("user")
def user_services():
    listings = query_all(
        "SELECT mv.*, ec.name AS event_name FROM marketplace_vendors mv "
        "JOIN event_categories ec ON ec.slug = mv.event_type_slug "
        "WHERE mv.is_active = 1"
    )
    return render_template("user/events_vendors.html", listings=listings, user=session)


@app.route("/user/gallery")
@login_required("user")
def user_gallery():
    images = query_all("SELECT * FROM gallery_images ORDER BY created_at DESC")
    return render_template("user/gallery.html", images=images, user=session)


@app.route("/user/about")
@login_required("user")
def user_about():
    return render_template("user/about.html", user=session)


@app.route("/user/profile", methods=["GET", "POST"])
@login_required("user")
def user_profile():
    user_id = session["user_id"]
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        address = request.form.get("address", "").strip()
        contact = request.form.get("contact", "").strip()
        
        # Get existing user profile image
        user = query_one("SELECT profile_image FROM users WHERE user_id = %s", (user_id,))
        profile_image = user["profile_image"] if user else None
        
        if 'profile_image' in request.files:
            file = request.files['profile_image']
            if file and file.filename != '':
                if allowed_file(file.filename):
                    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
                    filename = secure_filename("user_{}_{}".format(user_id, file.filename))
                    file_path = os.path.join(UPLOAD_FOLDER, filename)
                    file.save(file_path)
                    profile_image = "/static/uploads/{}".format(filename)
                else:
                    flash("Invalid file type. Allowed formats: PNG, JPG, JPEG, GIF, WEBP.", "error")
                    
        execute(
            "UPDATE users SET username = %s, address = %s, contact = %s, profile_image = %s WHERE user_id = %s",
            (username, address, contact, profile_image, user_id),
        )
        session["username"] = username
        session["profile_image"] = profile_image
        flash("Profile updated.", "success")
        return redirect(url_for("user_profile"))

    user = query_one("SELECT * FROM users WHERE user_id = %s", (user_id,))
    return render_template("user/profile.html", user=user)


# ---------------------------------------------------------------------------
# API Routes for user marketplace
# ---------------------------------------------------------------------------
@app.route("/api/vendors")
@login_required("user")
def api_vendors():
    # 1. Fetch all standard vendors
    db_vendors = query_all(
        "SELECT * FROM marketplace_vendors WHERE (badge != 'Individual Service' OR badge IS NULL) AND is_active = 1"
    )
    vendors_list = []
    for dv in db_vendors:
        packages = query_all(
            "SELECT * FROM vendor_packages WHERE listing_id = %s",
            (dv["vendor_listing_id"],)
        )
        pkgs_list = []
        for p in packages:
            services = query_all(
                "SELECT label, icon, price FROM package_services WHERE package_id = %s",
                (p["package_id"],)
            )
            pkgs_list.append({
                "img": p["image_url"],
                "tierClass": p["tier_class"],
                "tier": p["tier"],
                "title": p["title"],
                "subtitle": p["subtitle"],
                "score": str(p["score"]),
                "reviewCount": f"{p['review_count']} reviews",
                "quote": p["quote_text"],
                "author": p["quote_author"],
                "services": [{"label": s["label"], "icon": s["icon"], "price": int(s["price"])} for s in services]
            })
        vendors_list.append({
            "id": f"v_{dv['vendor_listing_id']}",
            "vendor_id": dv["vendor_id"],
            "name": dv["name"],
            "eventType": dv["event_type_slug"],
            "badge": dv["badge"],
            "location": dv["location"],
            "img": dv["image_url"],
            "description": dv["description"],
            "rating": str(dv["rating"]),
            "reviews": dv["review_count"],
            "priceFrom": dv["price_from"],
            "packages": pkgs_list
        })

    # 2. Fetch all individual services
    db_individuals = query_all(
        "SELECT * FROM marketplace_vendors WHERE badge = 'Individual Service' AND is_active = 1"
    )
    ind_list = []
    for di in db_individuals:
        profile = query_one(
            "SELECT vp.badge, u.username FROM vendor_profiles vp "
            "JOIN users u ON u.user_id = vp.user_id WHERE vp.vendor_id = %s",
            (di["vendor_id"],)
        )
        provider_name = profile["username"] if profile else "Independent Provider"
        
        # Fetch individual services from vendor_services directly
        services = query_all(
            "SELECT name as label, category, price_label, description, image_url FROM vendor_services WHERE vendor_id = %s AND status = 'Active'",
            (di["vendor_id"],)
        )
        items_list = []
        category_icons = {
            'photography': 'fa-camera',
            'decoration': 'fa-wand-magic-sparkles',
            'catering': 'fa-utensils',
            'music': 'fa-music',
            'makeup': 'fa-face-smile',
            'mehendi': 'fa-hands',
            'lighting': 'fa-lightbulb',
            'cake': 'fa-cake-candles',
            'transport': 'fa-bus',
            'anchoring': 'fa-microphone',
            'security': 'fa-shield-halved',
            'floral': 'fa-leaf',
            'photobooth': 'fa-camera-retro',
            'entertainment': 'fa-gamepad'
        }
        for s in services:
            svc_category = get_category_slug(s["category"])
            icon_val = category_icons.get(svc_category, 'fa-star')
            price_val = parse_price_label(s["price_label"])
            items_list.append({
                "label": s["label"],
                "icon": icon_val,
                "price": int(price_val),
                "category": svc_category,
                "description": s["description"],
                "image_url": s["image_url"]
            })
            
        ind_list.append({
            "id": f"ind_{di['vendor_listing_id']}",
            "vendor_id": di["vendor_id"],
            "name": di["name"],
            "type": di["event_type_slug"],
            "eventTags": ["wedding", "anniversary", "engagement", "birthday", "party", "babyshower", "corporate", "concert", "cultural", "religious", "sports", "social", "festival", "exhibition", "charity"],
            "location": di["location"],
            "img": di["image_url"],
            "provider": provider_name,
            "description": di["description"],
            "rating": str(di["rating"]),
            "reviews": di["review_count"],
            "priceFrom": di["price_from"],
            "color": "#0a1a6a",
            "features": ["Verified Provider", "Professional Equipment", "Flexible Timing"],
            "items": items_list
        })

    return {"vendors": vendors_list, "individualServices": ind_list}


@app.route("/api/user/requests")
@login_required("user")
def api_user_requests():
    user_id = session["user_id"]
    rows = query_all(
        "SELECT b.*, mv.name AS vendor_name, mv.badge AS vendor_badge, r.review_id, vp.user_id AS vendor_user_id "
        "FROM bookings b "
        "LEFT JOIN marketplace_vendors mv ON mv.vendor_listing_id = b.listing_id "
        "LEFT JOIN vendor_profiles vp ON vp.vendor_id = b.vendor_id "
        "LEFT JOIN reviews r ON r.booking_id = b.booking_id "
        "WHERE b.user_id = %s ORDER BY b.created_at DESC",
        (user_id,)
    )
    requests_list = []
    for r in rows:
        items = query_all(
            "SELECT service_label, price FROM booking_line_items WHERE booking_id = %s",
            (r["booking_id"],)
        )
        package_title = "Custom Services"
        if r["package_id"]:
            pkg = query_one("SELECT title FROM vendor_packages WHERE package_id = %s", (r["package_id"],))
            if pkg:
                package_title = pkg["title"]

        event_date_str = r["event_date"].strftime("%Y-%m-%d") if r["event_date"] else ""
        event_time_str = str(r["event_time"])[:5] if r["event_time"] else ""

        requests_list.append({
            "id": f"REQ-{r['booking_id']}",
            "booking_id_raw": r["booking_id"],
            "vendorId": r["vendor_id"],
            "vendorUserId": r["vendor_user_id"],
            "vendorName": r["vendor_name"] or "Independent Vendor",
            "packageTitle": package_title,
            "vendorBadge": r["vendor_badge"] or "Individual Service",
            "eventDate": event_date_str,
            "eventDateDisplay": r["event_date"].strftime("%b %d, %Y") if r["event_date"] else "TBD",
            "eventTime": event_time_str,
            "eventTimeDisplay": event_time_str or "TBD",
            "services": [{"label": i["service_label"], "price": int(i["price"])} for i in items],
            "total": int(r["total_amount"]),
            "customNote": r["notes"] or "",
            "status": r["status"],
            "submittedAt": r["created_at"].isoformat() if r["created_at"] else "",
            "category": r["event_type"],
            "hasReview": r["review_id"] is not None,
            "cancellationReason": r["cancellation_reason"] or ""
        })
    return {"requests": requests_list}


@app.route("/api/user/notifications", methods=["GET"])
@login_required("user")
def api_user_notifications():
    user_id = session["user_id"]
    notifications = query_all(
        "SELECT notification_id, message, is_read, created_at FROM notifications "
        "WHERE user_id = %s ORDER BY created_at DESC LIMIT 10",
        (user_id,)
    )
    # Convert datetime objects to string format for JSON serialization
    for n in notifications:
        if n["created_at"]:
            n["created_at"] = n["created_at"].isoformat()
    return {"status": "success", "notifications": notifications}


@app.route("/api/user/notifications/read", methods=["POST"])
@login_required("user")
def api_user_notifications_read():
    user_id = session["user_id"]
    execute("UPDATE notifications SET is_read = 1 WHERE user_id = %s", (user_id,))
    return {"status": "success"}


@app.route("/api/user/request", methods=["POST"])
@login_required("user")
def api_create_user_request():
    data = request.json or {}
    listing_id_str = data.get("vendor_listing_id")
    listing_id = None
    if listing_id_str:
        listing_id_str = str(listing_id_str).replace("v_", "").replace("ind_", "")
        if listing_id_str.isdigit():
            listing_id = int(listing_id_str)

    package_title = data.get("package_title")
    event_date = data.get("event_date")
    event_time = data.get("event_time") or None
    services = data.get("services", [])
    total = data.get("total", 0)
    custom_note = data.get("custom_note", "")

    vendor_id = None
    event_type = "wedding"
    if listing_id:
        mv = query_one(
            "SELECT vendor_id, event_type_slug FROM marketplace_vendors WHERE vendor_listing_id = %s",
            (listing_id,)
        )
        if mv:
            vendor_id = mv["vendor_id"]
            event_type = mv["event_type_slug"]

    package_id = None
    if listing_id and package_title:
        pkg = query_one(
            "SELECT package_id FROM vendor_packages WHERE listing_id = %s AND title = %s",
            (listing_id, package_title)
        )
        if pkg:
            package_id = pkg["package_id"]

    booking_id = execute(
        "INSERT INTO bookings (user_id, vendor_id, listing_id, package_id, event_type, event_date, event_time, venue, total_amount, status, notes) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, 'To Be Decided', %s, 'pending', %s)",
        (session["user_id"], vendor_id, listing_id, package_id, event_type, event_date, event_time, total, custom_note)
    )

    for s in services:
        execute(
            "INSERT INTO booking_line_items (booking_id, service_label, price) VALUES (%s, %s, %s)",
            (booking_id, s.get("label"), s.get("price", 0))
        )

    return {"status": "success", "booking_id": booking_id, "reqId": f"REQ-{booking_id}"}


@app.route("/api/user/wishlist")
@login_required("user")
def api_user_wishlist():
    user_id = session["user_id"]
    rows = query_all("SELECT * FROM wishlist WHERE user_id = %s", (user_id,))
    wishlist_list = []
    for r in rows:
        wishlist_list.append({
            "id": f"wishlist_{r['wishlist_id']}",
            "listingId": f"v_{r['listing_id']}" if r['package_id'] else f"service_{r['listing_id']}",
            "vendorId": r["listing_id"],
            "vendorName": r["vendor_name"],
            "eventType": r["event_type"],
            "type": "package" if r["package_id"] else "individual"
        })
    return {"wishlist": wishlist_list}


@app.route("/api/user/wishlist/toggle", methods=["POST"])
@login_required("user")
def api_user_wishlist_toggle():
    data = request.json or {}
    item_id_str = data.get("itemId", "")
    listing_id = None
    is_package = True
    vendor_name = data.get("vendorName", "")
    event_type = data.get("eventType", "")

    clean_id = item_id_str.replace("service_", "").replace("vendor_", "").replace("v_", "").replace("ind_", "")
    if clean_id.isdigit():
        listing_id = int(clean_id)

    if "service" in item_id_str or "ind_" in item_id_str:
        is_package = False

    user_id = session["user_id"]
    pkg_id_val = 1 if is_package else None
    existing = query_one(
        "SELECT wishlist_id FROM wishlist WHERE user_id = %s AND listing_id = %s AND (package_id IS NOT NULL) = %s",
        (user_id, listing_id, is_package)
    )
    if existing:
        execute("DELETE FROM wishlist WHERE wishlist_id = %s", (existing["wishlist_id"],))
        action = "removed"
    else:
        execute(
            "INSERT INTO wishlist (user_id, listing_id, package_id, vendor_name, event_type) "
            "VALUES (%s, %s, %s, %s, %s)",
            (user_id, listing_id, pkg_id_val, vendor_name, event_type)
        )
        action = "added"
    return {"status": "success", "action": action}


@app.route("/user/wishlist/add", methods=["POST"])
@login_required("user")
def wishlist_add():
    listing_id = request.form.get("listing_id")
    package_id = request.form.get("package_id") or None
    vendor_name = request.form.get("vendor_name", "")
    event_type = request.form.get("event_type", "")
    try:
        execute(
            "INSERT INTO wishlist (user_id, listing_id, package_id, vendor_name, event_type) "
            "VALUES (%s, %s, %s, %s, %s)",
            (session["user_id"], listing_id, package_id, vendor_name, event_type),
        )
        flash("Added to wishlist.", "success")
    except mysql.connector.Error:
        flash("Item is already in your wishlist.", "info")
    return redirect(request.referrer or url_for("user_services"))


@app.route("/user/wishlist/remove/<int:wishlist_id>", methods=["POST"])
@login_required("user")
def wishlist_remove(wishlist_id):
    execute(
        "DELETE FROM wishlist WHERE wishlist_id = %s AND user_id = %s",
        (wishlist_id, session["user_id"]),
    )
    flash("Removed from wishlist.", "info")
    return redirect(request.referrer or url_for("user_services"))


@app.route("/user/request", methods=["POST"])
@login_required("user")
def create_service_request():
    listing_id = request.form.get("listing_id")
    package_id = request.form.get("package_id")
    vendor_name = request.form.get("vendor_name", "")
    event_type = request.form.get("event_type", "")
    selected = request.form.get("selected_services", "[]")
    total = request.form.get("total_amount", 0)
    execute(
        "INSERT INTO service_requests "
        "(user_id, listing_id, package_id, vendor_name, event_type, selected_services, total_amount) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s)",
        (
            session["user_id"],
            listing_id,
            package_id,
            vendor_name,
            event_type,
            selected,
            total,
        ),
    )
    flash("Service request submitted.", "success")
    return redirect(url_for("user_services"))


@app.route("/user/booking", methods=["POST"])
@login_required("user")
def create_booking():
    execute(
        "INSERT INTO bookings (user_id, listing_id, package_id, vendor_id, event_type, "
        "event_date, venue, total_amount, status, notes) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'pending', %s)",
        (
            session["user_id"],
            request.form.get("listing_id"),
            request.form.get("package_id"),
            request.form.get("vendor_id"),
            request.form.get("event_type"),
            request.form.get("event_date"),
            request.form.get("venue"),
            request.form.get("total_amount", 0),
            request.form.get("notes", ""),
        ),
    )
    flash("Booking request placed.", "success")
    return redirect(url_for("user_services"))


@app.route("/api/user/website-feedback", methods=["POST"])
@login_required("user")
def api_submit_website_feedback():
    data = request.json or {}
    rating = data.get("rating")
    feedback = data.get("feedback", "").strip()
    
    if not rating or not feedback:
        return {"status": "error", "message": "Rating and feedback text are required."}, 400
        
    user_id = session["user_id"]
    
    execute(
        "INSERT INTO website_reviews (user_id, rating, feedback) VALUES (%s, %s, %s)",
        (user_id, rating, feedback)
    )
    return {"status": "success", "message": "Thank you for your feedback!"}


@app.route("/api/user/booking/<int:booking_id>/review", methods=["POST"])
@login_required("user")
def api_submit_vendor_review(booking_id):
    data = request.json or {}
    rating = data.get("rating")
    review_text = data.get("review_text", "").strip()
    
    if not rating or not review_text:
        return {"status": "error", "message": "Rating and review text are required."}, 400
        
    user_id = session["user_id"]
    
    # Verify booking exists, is completed or confirmed, and belongs to this user
    booking = query_one(
        "SELECT vendor_id FROM bookings WHERE booking_id = %s AND user_id = %s AND status IN ('completed', 'confirmed')",
        (booking_id, user_id)
    )
    if not booking:
        return {"status": "error", "message": "Booking not found, not completed/confirmed, or unauthorized."}, 404
        
    vendor_id = booking["vendor_id"]
    if not vendor_id:
        return {"status": "error", "message": "No vendor linked to this booking."}, 400
        
    # Check if review already exists
    existing = query_one(
        "SELECT review_id FROM reviews WHERE booking_id = %s", (booking_id,)
    )
    if existing:
        return {"status": "error", "message": "You have already reviewed this booking."}, 400
        
    # Insert review (write to both review_text and comment for compatibility)
    execute(
        "INSERT INTO reviews (user_id, vendor_id, booking_id, rating, review_text, comment) VALUES (%s, %s, %s, %s, %s, %s)",
        (user_id, vendor_id, booking_id, rating, review_text, review_text)
    )
    
    # Recalculate average rating and review count for this vendor
    stats = query_one(
        "SELECT AVG(rating) AS avg_rating, COUNT(*) AS rev_count FROM reviews WHERE vendor_id = %s",
        (vendor_id,)
    )
    
    avg_rating = float(stats["avg_rating"]) if stats and stats["avg_rating"] is not None else 0.0
    rev_count = int(stats["rev_count"]) if stats and stats["rev_count"] is not None else 0
    
    # Update both vendor_profiles and marketplace_vendors
    execute(
        "UPDATE vendor_profiles SET rating = %s, review_count = %s WHERE vendor_id = %s",
        (avg_rating, rev_count, vendor_id)
    )
    execute(
        "UPDATE marketplace_vendors SET rating = %s, review_count = %s WHERE vendor_id = %s",
        (avg_rating, rev_count, vendor_id)
    )
    
    return {"status": "success", "message": "Review submitted successfully!"}


@app.route("/api/user/booking/<int:booking_id>/cancel", methods=["POST"])
@login_required("user")
def api_cancel_user_booking(booking_id):
    data = request.json or {}
    reason = data.get("reason", "").strip()
    
    if not reason:
        return {"status": "error", "message": "Cancellation reason is required."}, 400
        
    user_id = session["user_id"]
    
    # Verify the booking belongs to this user and is active (pending or confirmed)
    booking = query_one(
        "SELECT * FROM bookings WHERE booking_id = %s AND user_id = %s",
        (booking_id, user_id)
    )
    if not booking:
        return {"status": "error", "message": "Booking not found or access denied."}, 404
        
    if booking["status"] in ["completed", "cancelled"]:
        return {"status": "error", "message": f"Cannot cancel a booking that is already {booking['status']}."}, 400
        
    execute(
        "UPDATE bookings SET status = 'cancelled', cancellation_reason = %s WHERE booking_id = %s",
        (reason, booking_id)
    )
    
    # Notify vendor of the cancellation with the reason
    vendor_profile = query_one(
        "SELECT user_id FROM vendor_profiles WHERE vendor_id = %s",
        (booking["vendor_id"],)
    )
    if vendor_profile:
        customer = query_one("SELECT username FROM users WHERE user_id = %s", (user_id,))
        customer_name = customer["username"] if customer else "A customer"
        event_type = booking["event_type"] or "event"
        msg = f"Customer {customer_name} has cancelled their booking for {event_type} (Booking ID #{booking_id}). Reason: {reason}"
        execute(
            "INSERT INTO notifications (user_id, message) VALUES (%s, %s)",
            (vendor_profile["user_id"], msg)
        )
    
    return {"status": "success", "message": "Booking cancelled successfully."}


@app.route("/api/vendor/notifications", methods=["GET"])
@login_required("vendor")
def api_vendor_notifications():
    user_id = session["user_id"]
    notifications = query_all(
        "SELECT notification_id, message, is_read, created_at FROM notifications "
        "WHERE user_id = %s ORDER BY created_at DESC LIMIT 10",
        (user_id,)
    )
    for n in notifications:
        if n["created_at"]:
            n["created_at"] = n["created_at"].isoformat()
    return {"status": "success", "notifications": notifications}


@app.route("/api/vendor/notifications/read", methods=["POST"])
@login_required("vendor")
def api_vendor_notifications_read():
    user_id = session["user_id"]
    execute("UPDATE notifications SET is_read = 1 WHERE user_id = %s", (user_id,))
    return {"status": "success"}


@app.route("/api/public/website-reviews")
def api_public_website_reviews():
    rows = query_all(
        "SELECT wr.*, u.username, u.profile_image FROM website_reviews wr "
        "JOIN users u ON u.user_id = wr.user_id ORDER BY wr.created_at DESC LIMIT 6"
    )
    reviews_list = []
    for r in rows:
        reviews_list.append({
            "username": r["username"],
            "profile_image": r["profile_image"],
            "rating": float(r["rating"]),
            "feedback": r["feedback"],
            "created_at": r["created_at"].strftime("%b %d, %Y")
        })
    return {"reviews": reviews_list}


@app.route("/api/vendor/<int:vendor_id>/reviews")
def api_vendor_reviews(vendor_id):
    rows = query_all(
        "SELECT r.*, u.username, u.profile_image FROM reviews r "
        "JOIN users u ON u.user_id = r.user_id WHERE r.vendor_id = %s ORDER BY r.created_at DESC",
        (vendor_id,)
    )
    reviews_list = []
    for r in rows:
        reviews_list.append({
            "username": r["username"],
            "profile_image": r["profile_image"],
            "rating": float(r["rating"]),
            "review_text": r["review_text"] or r["comment"] or "",
            "reply_text": r["reply_text"] or "",
            "created_at": r["created_at"].strftime("%b %d, %Y")
        })
    return {"reviews": reviews_list}


# ---------------------------------------------------------------------------
# Vendor portal
# ---------------------------------------------------------------------------
def get_vendor_id():
    row = query_one(
        "SELECT vendor_id FROM vendor_profiles WHERE user_id = %s",
        (session["user_id"],),
    )
    return row["vendor_id"] if row else None


@app.route("/vendor/dashboard")
@login_required("vendor")
def vendor_dashboard():
    vendor_id = get_vendor_id()
    
    # Increment profile views
    execute(
        "UPDATE vendor_profiles SET profile_views = profile_views + 1 WHERE vendor_id = %s",
        (vendor_id,),
    )
    
    bookings = query_all(
        "SELECT b.*, u.username AS customer_name, u.profile_image AS customer_profile_image FROM bookings b "
        "JOIN users u ON u.user_id = b.user_id "
        "WHERE b.vendor_id = %s ORDER BY b.created_at DESC",
        (vendor_id,),
    )
    earnings_row = query_one(
        "SELECT COALESCE(SUM(total_amount), 0) AS total FROM bookings "
        "WHERE vendor_id = %s AND status IN ('confirmed', 'completed')",
        (vendor_id,),
    )
    stats = query_one(
        "SELECT COUNT(*) AS pending_bookings FROM bookings "
        "WHERE vendor_id = %s AND status = 'pending'",
        (vendor_id,),
    )
    profile = query_one(
        "SELECT vp.*, u.username FROM vendor_profiles vp "
        "JOIN users u ON u.user_id = vp.user_id WHERE vp.vendor_id = %s",
        (vendor_id,),
    )
    
    # Calculate monthly earnings for the last 5 months
    monthly_raw = query_all(
        "SELECT DATE_FORMAT(event_date, '%%Y-%%m') AS month_key, "
        "DATE_FORMAT(event_date, '%%b') AS month_name, "
        "SUM(total_amount) AS amount "
        "FROM bookings "
        "WHERE vendor_id = %s AND status IN ('confirmed', 'completed') "
        "GROUP BY month_key, month_name "
        "ORDER BY month_key DESC LIMIT 5",
        (vendor_id,),
    )
    
    import datetime
    months_data = []
    for i in range(4, -1, -1):
        today = datetime.date.today()
        year = today.year
        month = today.month - i
        while month <= 0:
            month += 12
            year -= 1
        d = datetime.date(year, month, 1)
        month_name = d.strftime('%b')
        month_key = d.strftime('%Y-%m')
        months_data.append({'month_name': month_name, 'month_key': month_key, 'amount': 0.0})
        
    for mr in monthly_raw:
        for md in months_data:
            if md['month_key'] == mr['month_key']:
                md['amount'] = float(mr['amount'])
                
    max_amount = max([md['amount'] for md in months_data]) or 1.0
    for md in months_data:
        md['height_percent'] = min(100, max(5, int((md['amount'] / max_amount) * 100)))
        
    return render_template(
        "vendor/dashboard.html",
        bookings=bookings,
        total_earnings=earnings_row["total"] if earnings_row else 0,
        stats=stats,
        profile=profile,
        months_data=months_data,
        user=session,
    )


@app.route("/vendor/services", methods=["GET", "POST"])
@login_required("vendor")
def vendor_services():
    vendor_id = get_vendor_id()
    if request.method == "POST":
        image_url = request.form.get("image_url") or ""
        if 'image_file' in request.files:
            file = request.files['image_file']
            if file and file.filename != '':
                if allowed_file(file.filename):
                    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
                    filename = secure_filename("service_{}_{}".format(vendor_id, file.filename))
                    file_path = os.path.join(UPLOAD_FOLDER, filename)
                    file.save(file_path)
                    image_url = "/static/uploads/{}".format(filename)
                else:
                    flash("Invalid file type. Allowed formats: PNG, JPG, JPEG, GIF, WEBP.", "error")
                    
        execute(
            "INSERT INTO vendor_services (vendor_id, name, category, price_label, description, image_url, status) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (
                vendor_id,
                request.form.get("name"),
                request.form.get("category"),
                request.form.get("price_label"),
                request.form.get("description"),
                image_url,
                request.form.get("status", "Active"),
            ),
        )

        # Synchronize to user marketplace tables
        try:
            listings = query_all("SELECT vendor_listing_id FROM marketplace_vendors WHERE vendor_id = %s", (vendor_id,))
            if not listings:
                vp = query_one("SELECT * FROM vendor_profiles WHERE vendor_id = %s", (vendor_id,))
                if vp:
                    cat_slug = get_category_slug(vp.get("service_category"))
                    
                    listing_id = execute(
                        "INSERT INTO marketplace_vendors (vendor_id, name, event_type_slug, location, image_url, description, badge, is_active) "
                        "VALUES (%s, %s, %s, %s, %s, %s, 'Individual Service', 1)",
                        (vendor_id, vp["business_name"], cat_slug, vp["city"], vp.get("image_url"), vp.get("description"))
                    )
                    listings = [{"vendor_listing_id": listing_id}]
                else:
                    listings = []

            price_val = parse_price_label(request.form.get("price_label"))

            # Determine icon based on category
            category_icons = {
                'photography': 'fa-camera',
                'decoration': 'fa-wand-magic-sparkles',
                'catering': 'fa-utensils',
                'music': 'fa-music',
                'music & dj': 'fa-music',
                'makeup': 'fa-face-smile',
                'makeup & styling': 'fa-face-smile',
                'mehendi': 'fa-hands',
                'lighting': 'fa-lightbulb',
                'cake': 'fa-cake-candles',
                'cake & desserts': 'fa-cake-candles',
                'transport': 'fa-bus',
                'anchoring': 'fa-microphone',
                'anchoring & mc': 'fa-microphone',
                'security': 'fa-shield-halved',
                'floral': 'fa-leaf',
                'floral & garlands': 'fa-leaf',
                'photobooth': 'fa-camera-retro',
                'entertainment': 'fa-gamepad'
            }
            svc_category = get_category_slug(request.form.get("category"))
            icon_val = category_icons.get(svc_category, 'fa-star')

            for l in listings:
                listing_id = l["vendor_listing_id"]
                packages = query_all("SELECT package_id FROM vendor_packages WHERE listing_id = %s", (listing_id,))
                if not packages:
                    # Create default standard package
                    vp = query_one("SELECT business_name, image_url FROM vendor_profiles WHERE vendor_id = %s", (vendor_id,))
                    business_name = vp["business_name"] if vp else "Vendor"
                    img_url = vp["image_url"] if vp else None
                    package_id = execute(
                        "INSERT INTO vendor_packages (listing_id, tier, tier_class, title, subtitle, image_url, score, review_count, quote_text, quote_author) "
                        "VALUES (%s, 'Standard', 'tier-classic', %s, 'Select services', %s, 5.0, 0, 'Great services!', 'Customer')",
                        (listing_id, f"{business_name} Services", img_url)
                    )
                    packages = [{"package_id": package_id}]

                for p in packages:
                    pkg_id = p["package_id"]
                    # Add to package_services if not already present
                    exists = query_one("SELECT item_id FROM package_services WHERE package_id = %s AND label = %s", (pkg_id, request.form.get("name")))
                    if not exists:
                        execute(
                            "INSERT INTO package_services (package_id, label, icon, price) VALUES (%s, %s, %s, %s)",
                            (pkg_id, request.form.get("name"), icon_val, price_val)
                        )
        except Exception as e:
            print("Error syncing vendor service insertion to user marketplace: {}".format(e))

        flash("Service added.", "success")
        return redirect(url_for("vendor_services"))

    services = query_all(
        "SELECT * FROM vendor_services WHERE vendor_id = %s ORDER BY service_id DESC",
        (vendor_id,),
    )
    packages = query_all(
        "SELECT vp.*, mv.event_type_slug FROM vendor_packages vp "
        "JOIN marketplace_vendors mv ON mv.vendor_listing_id = vp.listing_id "
        "WHERE mv.vendor_id = %s ORDER BY vp.package_id DESC",
        (vendor_id,),
    )
    for p in packages:
        p["services"] = query_all(
            "SELECT * FROM package_services WHERE package_id = %s",
            (p["package_id"],)
        )
    return render_template("vendor/services.html", services=services, packages=packages, user=session)


@app.route("/vendor/service/<int:service_id>/edit", methods=["POST"])
@login_required("vendor")
def vendor_edit_service(service_id):
    vendor_id = get_vendor_id()
    svc = query_one("SELECT * FROM vendor_services WHERE service_id = %s AND vendor_id = %s", (service_id, vendor_id))
    if not svc:
        flash("Service not found or access denied.", "error")
        return redirect(url_for("vendor_services"))
        
    name = request.form.get("name")
    category = request.form.get("category")
    price_label = request.form.get("price_label")
    description = request.form.get("description")
    status = request.form.get("status", "Active")
    
    image_url = request.form.get("image_url") or svc["image_url"]
    if 'image_file' in request.files:
        file = request.files['image_file']
        if file and file.filename != '':
            if allowed_file(file.filename):
                os.makedirs(UPLOAD_FOLDER, exist_ok=True)
                filename = secure_filename("service_{}_{}".format(vendor_id, file.filename))
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                file.save(file_path)
                image_url = "/static/uploads/{}".format(filename)
            else:
                flash("Invalid file type. Allowed formats: PNG, JPG, JPEG, GIF, WEBP.", "error")
                
    old_name = svc["name"]
    execute(
        "UPDATE vendor_services SET name = %s, category = %s, price_label = %s, description = %s, image_url = %s, status = %s "
        "WHERE service_id = %s AND vendor_id = %s",
        (name, category, price_label, description, image_url, status, service_id, vendor_id)
    )

    # Synchronize to user marketplace tables
    try:
        price_val = parse_price_label(price_label)
        category_icons = {
            'photography': 'fa-camera',
            'decoration': 'fa-wand-magic-sparkles',
            'catering': 'fa-utensils',
            'music': 'fa-music',
            'music & dj': 'fa-music',
            'makeup': 'fa-face-smile',
            'makeup & styling': 'fa-face-smile',
            'mehendi': 'fa-hands',
            'lighting': 'fa-lightbulb',
            'cake': 'fa-cake-candles',
            'cake & desserts': 'fa-cake-candles',
            'transport': 'fa-bus',
            'anchoring': 'fa-microphone',
            'anchoring & mc': 'fa-microphone',
            'security': 'fa-shield-halved',
            'floral': 'fa-leaf',
            'floral & garlands': 'fa-leaf',
            'photobooth': 'fa-camera-retro',
            'entertainment': 'fa-gamepad'
        }
        svc_category = get_category_slug(category)
        icon_val = category_icons.get(svc_category, 'fa-star')

        packages = query_all(
            "SELECT package_id FROM vendor_packages WHERE listing_id IN "
            "(SELECT vendor_listing_id FROM marketplace_vendors WHERE vendor_id = %s)",
            (vendor_id,)
        )
        for p in packages:
            pkg_id = p["package_id"]
            exists = query_one("SELECT item_id FROM package_services WHERE package_id = %s AND label = %s", (pkg_id, old_name))
            if exists:
                execute(
                    "UPDATE package_services SET label = %s, price = %s, icon = %s WHERE item_id = %s",
                    (name, price_val, icon_val, exists["item_id"])
                )
            else:
                execute(
                    "INSERT INTO package_services (package_id, label, icon, price) VALUES (%s, %s, %s, %s)",
                    (pkg_id, name, icon_val, price_val)
                )
    except Exception as e:
        print("Error syncing vendor service update to user marketplace: {}".format(e))

    flash("Service updated successfully.", "success")
    return redirect(url_for("vendor_services"))


@app.route("/vendor/service/<int:service_id>/delete", methods=["POST"])
@login_required("vendor")
def vendor_delete_service(service_id):
    vendor_id = get_vendor_id()
    svc = query_one("SELECT name FROM vendor_services WHERE service_id = %s AND vendor_id = %s", (service_id, vendor_id))
    if not svc:
        flash("Service not found or access denied.", "error")
        return redirect(url_for("vendor_services"))
        
    service_name = svc["name"]
    execute(
        "DELETE FROM vendor_services WHERE service_id = %s AND vendor_id = %s",
        (service_id, vendor_id)
    )

    # Synchronize to user marketplace tables
    try:
        packages = query_all(
            "SELECT package_id FROM vendor_packages WHERE listing_id IN "
            "(SELECT vendor_listing_id FROM marketplace_vendors WHERE vendor_id = %s)",
            (vendor_id,)
        )
        for p in packages:
            pkg_id = p["package_id"]
            execute(
                "DELETE FROM package_services WHERE package_id = %s AND label = %s",
                (pkg_id, service_name)
            )
    except Exception as e:
        print("Error syncing vendor service deletion to user marketplace: {}".format(e))

    flash("Service deleted successfully.", "success")
    return redirect(url_for("vendor_services"))


@app.route("/vendor/package/add", methods=["POST"])
@login_required("vendor")
def vendor_add_package():
    vendor_id = get_vendor_id()
    title = request.form.get("title", "").strip()
    tier = request.form.get("tier", "Standard").strip()
    subtitle = request.form.get("subtitle", "").strip()[:255]
    event_type = request.form.get("event_type", "wedding").strip().lower()
    quote_text = request.form.get("quote_text", "Excellent services!").strip()
    quote_author = request.form.get("quote_author", "Customer").strip()
    
    selected_svc_ids = request.form.getlist("services")
    
    if not title or not selected_svc_ids:
        flash("Package title and at least one selected service are required.", "error")
        return redirect(url_for("vendor_services"))
        
    vp = query_one("SELECT * FROM vendor_profiles WHERE vendor_id = %s", (vendor_id,))
    if not vp:
        flash("Vendor profile not found.", "error")
        return redirect(url_for("vendor_services"))
        
    image_url = request.form.get("image_url") or ""
    if 'image_file' in request.files:
        file = request.files['image_file']
        if file and file.filename != '':
            if allowed_file(file.filename):
                os.makedirs(UPLOAD_FOLDER, exist_ok=True)
                filename = secure_filename("package_{}_{}".format(vendor_id, file.filename))
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                file.save(file_path)
                image_url = "/static/uploads/{}".format(filename)
            else:
                flash("Invalid file type. Allowed formats: PNG, JPG, JPEG, GIF, WEBP.", "error")
                
    if not image_url:
        image_url = vp.get("image_url") or ""

    tier_classes = {
        "Standard": "tier-classic",
        "Silver": "tier-silver",
        "Gold": "tier-gold",
        "Platinum": "tier-platinum"
    }
    tier_class = tier_classes.get(tier, "tier-classic")

    try:
        # 1. Ensure standard package listing exists in marketplace_vendors (badge != 'Individual Service' or badge IS NULL) for the chosen event_type
        mv = query_one(
            "SELECT vendor_listing_id, image_url, description FROM marketplace_vendors "
            "WHERE vendor_id = %s AND event_type_slug = %s AND (badge != 'Individual Service' OR badge IS NULL)",
            (vendor_id, event_type)
        )
        if not mv:
            listing_id = execute(
                "INSERT INTO marketplace_vendors (vendor_id, name, event_type_slug, location, image_url, description, badge, is_active) "
                "VALUES (%s, %s, %s, %s, %s, %s, 'Premium Vendor', 1)",
                (vendor_id, vp["business_name"], event_type, vp["city"], image_url, vp.get("description"))
            )
        else:
            listing_id = mv["vendor_listing_id"]
            execute(
                "UPDATE marketplace_vendors SET image_url = %s, description = %s WHERE vendor_listing_id = %s",
                (image_url or mv["image_url"], vp.get("description") or mv["description"], listing_id)
            )

        # 2. Insert package into vendor_packages
        package_id = execute(
            "INSERT INTO vendor_packages (listing_id, tier, tier_class, title, subtitle, image_url, score, review_count, quote_text, quote_author) "
            "VALUES (%s, %s, %s, %s, %s, %s, 5.0, 0, %s, %s)",
            (listing_id, tier, tier_class, title, subtitle, image_url, quote_text, quote_author)
        )

        # 3. Fetch details of selected services and insert them into package_services
        for svc_id in selected_svc_ids:
            svc = query_one(
                "SELECT * FROM vendor_services WHERE service_id = %s AND vendor_id = %s",
                (int(svc_id), vendor_id)
            )
            if svc:
                price_val = parse_price_label(svc["price_label"])
                
                category_icons = {
                    'photography': 'fa-camera',
                    'decoration': 'fa-wand-magic-sparkles',
                    'catering': 'fa-utensils',
                    'music': 'fa-music',
                    'music & dj': 'fa-music',
                    'makeup': 'fa-spa',
                    'makeup & styling': 'fa-spa',
                    'mehendi': 'fa-hand',
                    'lighting': 'fa-lightbulb',
                    'cake': 'fa-cake-candles',
                    'cake & desserts': 'fa-cake-candles',
                    'transport': 'fa-bus',
                    'anchoring': 'fa-microphone',
                    'anchoring & mc': 'fa-microphone',
                    'security': 'fa-shield-halved',
                    'floral': 'fa-seedling',
                    'floral & garlands': 'fa-seedling',
                    'photobooth': 'fa-image',
                    'entertainment': 'fa-masks-theater'
                }
                svc_category = get_category_slug(svc["category"])
                icon_val = category_icons.get(svc_category, 'fa-star')
                
                execute(
                    "INSERT INTO package_services (package_id, label, icon, price) "
                    "VALUES (%s, %s, %s, %s)",
                    (package_id, svc["name"], icon_val, price_val)
                )

        flash("Full Package published successfully!", "success")
    except Exception as e:
        print("Error creating vendor package: {}".format(e))
        flash("An error occurred while creating the package: {}".format(e), "error")

    return redirect(url_for("vendor_services"))


@app.route("/vendor/package/<int:package_id>/edit", methods=["POST"])
@login_required("vendor")
def vendor_edit_package(package_id):
    vendor_id = get_vendor_id()
    
    pkg = query_one(
        "SELECT vp.*, mv.vendor_listing_id FROM vendor_packages vp "
        "JOIN marketplace_vendors mv ON mv.vendor_listing_id = vp.listing_id "
        "WHERE vp.package_id = %s AND mv.vendor_id = %s",
        (package_id, vendor_id)
    )
    if not pkg:
        flash("Package not found or access denied.", "error")
        return redirect(url_for("vendor_services"))
        
    title = request.form.get("title", "").strip()
    tier = request.form.get("tier", "Standard").strip()
    subtitle = request.form.get("subtitle", "").strip()[:255]
    event_type = request.form.get("event_type", "wedding").strip().lower()
    quote_text = request.form.get("quote_text", "Excellent services!").strip()
    quote_author = request.form.get("quote_author", "Customer").strip()
    
    selected_svc_ids = request.form.getlist("services")
    
    if not title or not selected_svc_ids:
        flash("Package title and at least one selected service are required.", "error")
        return redirect(url_for("vendor_services"))
        
    vp = query_one("SELECT * FROM vendor_profiles WHERE vendor_id = %s", (vendor_id,))
    if not vp:
        flash("Vendor profile not found.", "error")
        return redirect(url_for("vendor_services"))
        
    image_url = request.form.get("image_url") or pkg["image_url"] or ""
    if 'image_file' in request.files:
        file = request.files['image_file']
        if file and file.filename != '':
            if allowed_file(file.filename):
                os.makedirs(UPLOAD_FOLDER, exist_ok=True)
                filename = secure_filename("package_{}_{}".format(vendor_id, file.filename))
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                file.save(file_path)
                image_url = "/static/uploads/{}".format(filename)
            else:
                flash("Invalid file type. Allowed formats: PNG, JPG, JPEG, GIF, WEBP.", "error")
                
    if not image_url:
        image_url = vp.get("image_url") or ""

    tier_classes = {
        "Standard": "tier-classic",
        "Silver": "tier-silver",
        "Gold": "tier-gold",
        "Platinum": "tier-platinum"
    }
    tier_class = tier_classes.get(tier, "tier-classic")

    try:
        # 1. Ensure marketplace listing exists for the chosen event_type
        mv = query_one(
            "SELECT vendor_listing_id, image_url, description FROM marketplace_vendors "
            "WHERE vendor_id = %s AND event_type_slug = %s AND (badge != 'Individual Service' OR badge IS NULL)",
            (vendor_id, event_type)
        )
        if not mv:
            listing_id = execute(
                "INSERT INTO marketplace_vendors (vendor_id, name, event_type_slug, location, image_url, description, badge, is_active) "
                "VALUES (%s, %s, %s, %s, %s, %s, 'Premium Vendor', 1)",
                (vendor_id, vp["business_name"], event_type, vp["city"], image_url, vp.get("description"))
            )
        else:
            listing_id = mv["vendor_listing_id"]
            execute(
                "UPDATE marketplace_vendors SET image_url = %s, description = %s WHERE vendor_listing_id = %s",
                (image_url or mv["image_url"], vp.get("description") or mv["description"], listing_id)
            )

        # 2. Update package record in vendor_packages
        execute(
            "UPDATE vendor_packages SET listing_id = %s, tier = %s, tier_class = %s, title = %s, subtitle = %s, image_url = %s, quote_text = %s, quote_author = %s "
            "WHERE package_id = %s",
            (listing_id, tier, tier_class, title, subtitle, image_url, quote_text, quote_author, package_id)
        )

        # 3. Rebuild bundled services
        execute("DELETE FROM package_services WHERE package_id = %s", (package_id,))
        
        for svc_id in selected_svc_ids:
            svc = query_one(
                "SELECT * FROM vendor_services WHERE service_id = %s AND vendor_id = %s",
                (int(svc_id), vendor_id)
            )
            if svc:
                price_val = parse_price_label(svc["price_label"])
                
                category_icons = {
                    'photography': 'fa-camera',
                    'decoration': 'fa-wand-magic-sparkles',
                    'catering': 'fa-utensils',
                    'music': 'fa-music',
                    'music & dj': 'fa-music',
                    'makeup': 'fa-spa',
                    'makeup & styling': 'fa-spa',
                    'mehendi': 'fa-hand',
                    'lighting': 'fa-lightbulb',
                    'cake': 'fa-cake-candles',
                    'cake & desserts': 'fa-cake-candles',
                    'transport': 'fa-bus',
                    'anchoring': 'fa-microphone',
                    'anchoring & mc': 'fa-microphone',
                    'security': 'fa-shield-halved',
                    'floral': 'fa-seedling',
                    'floral & garlands': 'fa-seedling',
                    'photobooth': 'fa-image',
                    'entertainment': 'fa-masks-theater'
                }
                svc_category = get_category_slug(svc["category"])
                icon_val = category_icons.get(svc_category, 'fa-star')
                
                execute(
                    "INSERT INTO package_services (package_id, label, icon, price) "
                    "VALUES (%s, %s, %s, %s)",
                    (package_id, svc["name"], icon_val, price_val)
                )

        flash("Full Package updated successfully!", "success")
    except Exception as e:
        print("Error updating vendor package: {}".format(e))
        flash("An error occurred while updating the package: {}".format(e), "error")
        
    return redirect(url_for("vendor_services"))


@app.route("/vendor/package/<int:package_id>/delete", methods=["POST"])
@login_required("vendor")
def vendor_delete_package(package_id):
    vendor_id = get_vendor_id()
    
    pkg = query_one(
        "SELECT vp.package_id, vp.listing_id FROM vendor_packages vp "
        "JOIN marketplace_vendors mv ON mv.vendor_listing_id = vp.listing_id "
        "WHERE vp.package_id = %s AND mv.vendor_id = %s",
        (package_id, vendor_id)
    )
    if not pkg:
        flash("Package not found or access denied.", "error")
        return redirect(url_for("vendor_services"))
        
    try:
        execute("DELETE FROM vendor_packages WHERE package_id = %s", (package_id,))
        flash("Package deleted successfully.", "success")
    except Exception as e:
        print("Error deleting package: {}".format(e))
        flash("An error occurred while deleting the package: {}".format(e), "error")
        
    return redirect(url_for("vendor_services"))


@app.route("/vendor/booking")
@login_required("vendor")
def vendor_booking():
    vendor_id = get_vendor_id()
    bookings = query_all(
        "SELECT b.*, u.username AS customer_name FROM bookings b "
        "JOIN users u ON u.user_id = b.user_id "
        "WHERE b.vendor_id = %s ORDER BY b.created_at DESC",
        (vendor_id,),
    )
    return render_template("vendor/booking.html", bookings=bookings, user=session)


@app.route("/vendor/booking/<int:booking_id>/status", methods=["POST"])
@login_required("vendor")
def vendor_update_booking(booking_id):
    status = request.form.get("status")
    vendor_id = get_vendor_id()
    
    booking = query_one("SELECT user_id FROM bookings WHERE booking_id = %s", (booking_id,))
    vendor = query_one("SELECT business_name FROM vendor_profiles WHERE vendor_id = %s", (vendor_id,))
    
    execute(
        "UPDATE bookings SET status = %s WHERE booking_id = %s AND vendor_id = %s",
        (status, booking_id, vendor_id),
    )
    
    if booking and vendor:
        user_id = booking["user_id"]
        vendor_name = vendor["business_name"]
        msg = ""
        if status in ["confirmed", "approved"]:
            msg = f"Your booking with {vendor_name} has been confirmed."
        elif status == "cancelled":
            msg = f"Your booking with {vendor_name} has been cancelled."
            
        if msg:
            execute("INSERT INTO notifications (user_id, message) VALUES (%s, %s)", (user_id, msg))
            
    flash("Booking status updated.", "success")
    return redirect(url_for("vendor_booking"))


@app.route("/vendor/reviews")
@login_required("vendor")
def vendor_reviews():
    vendor_id = get_vendor_id()
    reviews = query_all(
        "SELECT r.*, u.username, u.profile_image FROM reviews r "
        "JOIN users u ON u.user_id = r.user_id "
        "WHERE r.vendor_id = %s ORDER BY r.created_at DESC",
        (vendor_id,),
    )
    profile = query_one(
        "SELECT * FROM vendor_profiles WHERE vendor_id = %s",
        (vendor_id,),
    )
    return render_template("vendor/reviews.html", reviews=reviews, profile=profile, user=session)


@app.route("/vendor/messages")
@login_required("vendor")
def vendor_messages():
    vendor_id = get_vendor_id()
    profile = query_one(
        "SELECT vp.*, u.username FROM vendor_profiles vp "
        "JOIN users u ON u.user_id = vp.user_id WHERE vp.vendor_id = %s",
        (vendor_id,),
    )
    return render_template("vendor/messages.html", profile=profile, user=session)


@app.route("/user/messages")
@login_required("user")
def user_messages():
    user = query_one("SELECT * FROM users WHERE user_id = %s", (session["user_id"],))
    return render_template("user/messages.html", user=user)


@app.route("/api/chat/contacts", methods=["GET"])
@login_required()
def api_chat_contacts():
    user_id = session["user_id"]
    role = session.get("role")
    contacts_dict = {}
    
    # 1. Fetch contacts who have bookings with the user
    if role == "vendor":
        # Customers who booked this vendor
        vendor_id = get_vendor_id()
        rows = query_all(
            "SELECT DISTINCT u.user_id, u.username AS name, u.profile_image FROM users u "
            "JOIN bookings b ON b.user_id = u.user_id "
            "WHERE b.vendor_id = %s", (vendor_id,)
        )
        for r in rows:
            contacts_dict[r["user_id"]] = {
                "id": r["user_id"],
                "name": r["name"],
                "profile_image": r["profile_image"],
                "last_message": "No messages yet",
                "last_timestamp": "",
                "unread_count": 0
            }
    else:
        # Vendors this customer has booked
        rows = query_all(
            "SELECT DISTINCT u.user_id, vp.business_name AS name, u.profile_image FROM users u "
            "JOIN vendor_profiles vp ON vp.user_id = u.user_id "
            "JOIN bookings b ON b.vendor_id = vp.vendor_id "
            "WHERE b.user_id = %s", (user_id,)
        )
        for r in rows:
            contacts_dict[r["user_id"]] = {
                "id": r["user_id"],
                "name": r["name"],
                "profile_image": r["profile_image"],
                "last_message": "No messages yet",
                "last_timestamp": "",
                "unread_count": 0
            }
            
    # 2. Fetch contacts from existing messages (in case they have messages but no bookings)
    msg_rows = query_all(
        "SELECT DISTINCT u.user_id, u.username, u.role, u.profile_image, vp.business_name FROM users u "
        "LEFT JOIN vendor_profiles vp ON vp.user_id = u.user_id "
        "JOIN messages m ON (m.sender_id = u.user_id AND m.receiver_id = %s) OR (m.receiver_id = u.user_id AND m.sender_id = %s)",
        (user_id, user_id)
    )
    for r in msg_rows:
        uid = r["user_id"]
        if uid not in contacts_dict:
            name = r["business_name"] if r["role"] == "vendor" and r["business_name"] else r["username"]
            contacts_dict[uid] = {
                "id": uid,
                "name": name,
                "profile_image": r["profile_image"],
                "last_message": "No messages yet",
                "last_timestamp": "",
                "unread_count": 0
            }
            
    # 3. For each contact, fetch the latest message details and unread count
    for uid in list(contacts_dict.keys()):
        last_msg = query_one(
            "SELECT body, created_at FROM messages "
            "WHERE (sender_id = %s AND receiver_id = %s) OR (sender_id = %s AND receiver_id = %s) "
            "ORDER BY created_at DESC LIMIT 1",
            (user_id, uid, uid, user_id)
        )
        if last_msg:
            contacts_dict[uid]["last_message"] = last_msg["body"]
            contacts_dict[uid]["last_timestamp"] = last_msg["created_at"].isoformat() if last_msg["created_at"] else ""
            
        unread = query_one(
            "SELECT COUNT(*) AS count FROM messages "
            "WHERE sender_id = %s AND receiver_id = %s AND is_read = 0",
            (uid, user_id)
        )
        contacts_dict[uid]["unread_count"] = unread["count"] if unread else 0
        
    contacts_list = list(contacts_dict.values())
    contacts_list.sort(key=lambda x: x["last_timestamp"] or "", reverse=True)
    
    return {"status": "success", "contacts": contacts_list}


@app.route("/api/chat/messages/<int:partner_id>", methods=["GET"])
@login_required()
def api_chat_messages(partner_id):
    user_id = session["user_id"]
    
    # Mark messages from this partner as read
    execute(
        "UPDATE messages SET is_read = 1 WHERE sender_id = %s AND receiver_id = %s",
        (partner_id, user_id)
    )
    
    rows = query_all(
        "SELECT * FROM messages "
        "WHERE (sender_id = %s AND receiver_id = %s) OR (sender_id = %s AND receiver_id = %s) "
        "ORDER BY created_at ASC",
        (user_id, partner_id, partner_id, user_id)
    )
    
    messages_list = []
    for r in rows:
        messages_list.append({
            "message_id": r["message_id"],
            "sender_id": r["sender_id"],
            "receiver_id": r["receiver_id"],
            "body": r["body"],
            "is_read": r["is_read"],
            "created_at": r["created_at"].isoformat() if r["created_at"] else ""
        })
    return {"status": "success", "messages": messages_list}


@app.route("/api/chat/send", methods=["POST"])
@login_required()
def api_chat_send():
    sender_id = session["user_id"]
    data = request.json or {}
    receiver_id = data.get("receiver_id")
    body = data.get("body", "").strip()
    
    if not receiver_id or not body:
        return {"status": "error", "message": "Receiver ID and body are required."}, 400
        
    execute(
        "INSERT INTO messages (sender_id, receiver_id, body) VALUES (%s, %s, %s)",
        (sender_id, receiver_id, body)
    )
    return {"status": "success", "message": "Message sent successfully."}


@app.route("/vendor/earnings")
@login_required("vendor")
def vendor_earnings():
    vendor_id = get_vendor_id()
    bookings = query_all(
        "SELECT b.*, u.username AS customer_name FROM bookings b "
        "JOIN users u ON u.user_id = b.user_id "
        "WHERE b.vendor_id = %s ORDER BY b.created_at DESC",
        (vendor_id,),
    )
    total_earnings = 0
    pending_clearance = 0
    monthly_earnings = 0
    
    import datetime
    now = datetime.datetime.now()
    current_month_str = now.strftime("%Y-%m")
    
    for bk in bookings:
        amount = bk["total_amount"] or 0
        if bk["status"] in ["confirmed", "completed", "approved"]:
            total_earnings += amount
            event_date = bk["event_date"]
            event_date_str = ""
            if event_date:
                if hasattr(event_date, "strftime"):
                    event_date_str = event_date.strftime("%Y-%m")
                else:
                    event_date_str = str(event_date)[:7]
            if event_date_str == current_month_str:
                monthly_earnings += amount
        elif bk["status"] == "pending":
            pending_clearance += amount

    return render_template(
        "vendor/earnings.html",
        bookings=bookings,
        total_earnings=total_earnings,
        pending_clearance=pending_clearance,
        monthly_earnings=monthly_earnings,
        user=session
    )


@app.route("/vendor/profile", methods=["GET", "POST"])
@login_required("vendor")
def vendor_profile():
    vendor_id = get_vendor_id()
    if request.method == "POST":
        existing = query_one("SELECT image_url, cover_image FROM vendor_profiles WHERE vendor_id = %s", (vendor_id,))
        image_url = existing["image_url"] if existing else None
        cover_image = existing["cover_image"] if existing else None

        if 'image_url' in request.files:
            file = request.files['image_url']
            if file and file.filename != '':
                if allowed_file(file.filename):
                    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
                    filename = secure_filename("vendor_logo_{}_{}".format(vendor_id, file.filename))
                    file_path = os.path.join(UPLOAD_FOLDER, filename)
                    file.save(file_path)
                    image_url = "/static/uploads/{}".format(filename)
                else:
                    flash("Invalid file type for profile image. Allowed formats: PNG, JPG, JPEG, GIF, WEBP.", "error")

        if 'cover_image' in request.files:
            file = request.files['cover_image']
            if file and file.filename != '':
                if allowed_file(file.filename):
                    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
                    filename = secure_filename("vendor_cover_{}_{}".format(vendor_id, file.filename))
                    file_path = os.path.join(UPLOAD_FOLDER, filename)
                    file.save(file_path)
                    cover_image = "/static/uploads/{}".format(filename)
                else:
                    flash("Invalid file type for cover image. Allowed formats: PNG, JPG, JPEG, GIF, WEBP.", "error")

        execute(
            "UPDATE vendor_profiles SET business_name = %s, service_category = %s, city = %s, "
            "description = %s, location = %s, availability = %s, image_url = %s, cover_image = %s WHERE vendor_id = %s",
            (
                request.form.get("business_name"),
                request.form.get("service_category"),
                request.form.get("city"),
                request.form.get("description"),
                request.form.get("location"),
                request.form.get("availability", "available"),
                image_url,
                cover_image,
                vendor_id,
            ),
        )

        # Sync to all marketplace_vendors listings for this vendor
        execute(
            "UPDATE marketplace_vendors SET name = %s, location = %s, "
            "description = %s, image_url = %s WHERE vendor_id = %s",
            (
                request.form.get("business_name"),
                request.form.get("city"),
                request.form.get("description"),
                image_url,
                vendor_id,
            )
        )

        flash("Vendor profile updated.", "success")
        return redirect(url_for("vendor_profile"))

    profile = query_one(
        "SELECT vp.*, u.email, u.username FROM vendor_profiles vp "
        "JOIN users u ON u.user_id = vp.user_id WHERE vp.vendor_id = %s",
        (vendor_id,),
    )
    services = query_all(
        "SELECT * FROM vendor_services WHERE vendor_id = %s ORDER BY service_id DESC",
        (vendor_id,),
    )
    return render_template("vendor/profile.html", profile=profile, services=services, user=session)


# ---------------------------------------------------------------------------
# Admin portal
# ---------------------------------------------------------------------------
@app.route("/admin/dashboard")
@login_required("admin")
def admin_dashboard():
    stats = query_one(
        "SELECT "
        "(SELECT COUNT(*) FROM users WHERE role = 'user') AS total_users, "
        "(SELECT COUNT(*) FROM vendor_profiles WHERE status = 'approved') AS total_vendors, "
        "(SELECT COUNT(*) FROM bookings) AS total_bookings, "
        "(SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE status IN ('approved', 'confirmed', 'completed')) AS total_revenue"
    )
    pending = query_all(
        "SELECT * FROM vendor_registration_requests WHERE status = 'pending' "
        "ORDER BY created_at DESC LIMIT 10"
    )
    return render_template(
        "admin/dashboard.html",
        stats=stats,
        pending_requests=pending,
        user=session,
    )


@app.route("/admin/users")
@login_required("admin")
def admin_users():
    users = query_all(
        "SELECT user_id, username, email, contact, role, profile_image, created_at, status, age, gender, address FROM users ORDER BY created_at DESC"
    )
    
    total_registered = len(users)
    
    import datetime
    seven_days_ago = datetime.datetime.now() - datetime.timedelta(days=7)
    new_this_week = 0
    for u in users:
        if u['created_at'] and u['created_at'] >= seven_days_ago:
            new_this_week += 1
            
    active_bookings_count = query_one(
        "SELECT COUNT(*) as count FROM bookings WHERE status IN ('pending', 'approved', 'confirmed')"
    )["count"]
    
    blocked_users_count = query_one(
        "SELECT COUNT(*) as count FROM users WHERE status = 'blocked'"
    )["count"]
    
    return render_template(
        "admin/user.html",
        users=users,
        total_registered=total_registered,
        new_this_week=new_this_week,
        active_bookings=active_bookings_count,
        blocked_users=blocked_users_count,
        user=session
    )


@app.route("/admin/vendors")
@login_required("admin")
def admin_vendors():
    vendors = query_all(
        "SELECT vp.*, u.email, u.username, u.contact FROM vendor_profiles vp "
        "JOIN users u ON u.user_id = vp.user_id ORDER BY vp.vendor_id DESC"
    )
    pending = query_all(
        "SELECT * FROM vendor_registration_requests WHERE status = 'pending' ORDER BY created_at DESC"
    )
    return render_template(
        "admin/vendormanagement.html",
        vendors=vendors,
        pending_requests=pending,
        user=session,
    )


@app.route("/admin/vendor-request/<int:request_id>/approve", methods=["POST"])
@login_required("admin")
def approve_vendor_request(request_id):
    req = query_one(
        "SELECT * FROM vendor_registration_requests WHERE request_id = %s",
        (request_id,),
    )
    if not req:
        flash("Request not found.", "error")
        return redirect(url_for("admin_vendors"))

    username = request.form.get("username", req["full_name"]).strip()
    email = request.form.get("email", req["email"]).strip().lower()
    password = request.form.get("password", "").strip()
    contact = request.form.get("contact", req["phone"]).strip()

    if not password:
        password = "Vendor@123"

    # Verify if email is already in use
    existing_user = query_one("SELECT * FROM users WHERE email = %s", (email,))
    if existing_user:
        if existing_user["role"] == "user":
            # Promote existing user to vendor
            execute(
                "UPDATE users SET username = %s, password_hash = %s, contact = %s, role = 'vendor' WHERE user_id = %s",
                (username, hash_password(password), contact, existing_user["user_id"]),
            )
            user_id = existing_user["user_id"]
        elif existing_user["role"] == "vendor":
            user_id = existing_user["user_id"]
            # Just update password and contact
            execute(
                "UPDATE users SET username = %s, password_hash = %s, contact = %s WHERE user_id = %s",
                (username, hash_password(password), contact, user_id),
            )
        else:
            flash("An admin account with that email already exists.", "error")
            return redirect(url_for("admin_vendors"))
    else:
        user_id = execute(
            "INSERT INTO users (username, email, password_hash, contact, role) "
            "VALUES (%s, %s, %s, %s, 'vendor')",
            (
                username,
                email,
                hash_password(password),
                contact,
            ),
        )

    # Insert or update vendor profile
    existing_profile = query_one("SELECT vendor_id FROM vendor_profiles WHERE user_id = %s", (user_id,))
    if not existing_profile:
        vendor_id = execute(
            "INSERT INTO vendor_profiles (user_id, business_name, service_category, city, status) "
            "VALUES (%s, %s, %s, %s, 'approved')",
            (user_id, req["business_name"], req["service_type"], req["city"]),
        )
    else:
        vendor_id = existing_profile["vendor_id"]
        execute(
            "UPDATE vendor_profiles SET business_name = %s, service_category = %s, city = %s, status = 'approved' WHERE vendor_id = %s",
            (req["business_name"], req["service_type"], req["city"], vendor_id),
        )

    # Insert into marketplace_vendors so they are searchable in the marketplace
    mv = query_one("SELECT vendor_listing_id FROM marketplace_vendors WHERE vendor_id = %s", (vendor_id,))
    if not mv:
        cat_slug = get_category_slug(req["service_type"])
        
        execute(
            "INSERT INTO marketplace_vendors (vendor_id, name, event_type_slug, location, image_url, description, badge, is_active) "
            "VALUES (%s, %s, %s, %s, %s, %s, 'Individual Service', 1)",
            (vendor_id, req["business_name"], cat_slug, req["city"], None, "Professional " + req["service_type"] + " services in " + req["city"]),
        )

    execute(
        "UPDATE vendor_registration_requests SET status = 'approved' WHERE request_id = %s",
        (request_id,),
    )
    flash("Vendor approved successfully. Username: {}, Email: {}, Password: {}".format(username, email, password), "success")
    return redirect(url_for("admin_vendors"))


UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/admin/vendor/<int:vendor_id>/edit", methods=["POST"])
@login_required("admin")
def edit_vendor(vendor_id):
    vp = query_one("SELECT * FROM vendor_profiles WHERE vendor_id = %s", (vendor_id,))
    if not vp:
        flash("Vendor profile not found.", "error")
        return redirect(url_for("admin_vendors"))

    business_name = request.form.get("business_name", "").strip()
    email = request.form.get("email", "").strip().lower()
    contact = request.form.get("contact", "").strip()
    service_category = request.form.get("service_category", "").strip()
    city = request.form.get("city", "").strip()
    location = request.form.get("location", "").strip()
    description = request.form.get("description", "").strip()
    price_from = request.form.get("price_from", "").strip()

    if not business_name or not email:
        flash("Business name and email are required.", "error")
        return redirect(url_for("admin_vendors"))

    # Check email duplicate (excluding current user)
    existing_email = query_one(
        "SELECT user_id FROM users WHERE email = %s AND user_id != %s",
        (email, vp["user_id"])
    )
    if existing_email:
        flash("Email is already registered by another account.", "error")
        return redirect(url_for("admin_vendors"))

    # File Upload handling
    image_url = vp["image_url"]
    if 'image' in request.files:
        file = request.files['image']
        if file and file.filename != '':
            if allowed_file(file.filename):
                os.makedirs(UPLOAD_FOLDER, exist_ok=True)
                filename = secure_filename("vendor_{}_{}".format(vendor_id, file.filename))
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                file.save(file_path)
                image_url = "/static/uploads/{}".format(filename)
            else:
                flash("Invalid file type. Allowed formats: PNG, JPG, JPEG, GIF, WEBP.", "error")

    # Update database
    execute(
        "UPDATE vendor_profiles SET business_name = %s, service_category = %s, city = %s, "
        "location = %s, description = %s, price_from = %s, image_url = %s WHERE vendor_id = %s",
        (business_name, service_category, city, location, description, price_from, image_url, vendor_id)
    )
    execute(
        "UPDATE users SET username = %s, email = %s, contact = %s WHERE user_id = %s",
        (business_name, email, contact, vp["user_id"])
    )

    # Sync to marketplace_vendors if entry exists
    mv = query_one("SELECT vendor_listing_id FROM marketplace_vendors WHERE vendor_id = %s", (vendor_id,))
    if mv:
        execute(
            "UPDATE marketplace_vendors SET name = %s, event_type_slug = %s, location = %s, "
            "description = %s, price_from = %s, image_url = %s, badge = 'Individual Service' WHERE vendor_id = %s",
            (business_name, get_category_slug(service_category), city, description, price_from, image_url, vendor_id)
        )

    flash("Vendor profile updated successfully.", "success")
    return redirect(url_for("admin_vendors"))


@app.route("/admin/vendor/<int:vendor_id>/toggle-status", methods=["POST"])
@login_required("admin")
def toggle_vendor_status(vendor_id):
    vp = query_one("SELECT status FROM vendor_profiles WHERE vendor_id = %s", (vendor_id,))
    if not vp:
        return {"status": "error", "message": "Vendor not found"}, 404
    
    new_status = "suspended" if vp["status"] == "approved" else "approved"
    
    execute("UPDATE vendor_profiles SET status = %s WHERE vendor_id = %s", (new_status, vendor_id))
    
    # Also update marketplace_vendors active state
    is_active = 0 if new_status == "suspended" else 1
    execute("UPDATE marketplace_vendors SET is_active = %s WHERE vendor_id = %s", (is_active, vendor_id))
    
    return {"status": "success", "new_status": new_status}


@app.route("/admin/user/<int:user_id>/toggle-status", methods=["POST"])
@login_required("admin")
def toggle_user_status(user_id):
    u = query_one("SELECT status FROM users WHERE user_id = %s", (user_id,))
    if not u:
        return {"status": "error", "message": "User not found"}, 404
    
    new_status = "blocked" if u["status"] == "active" else "active"
    execute("UPDATE users SET status = %s WHERE user_id = %s", (new_status, user_id))
    return {"status": "success", "new_status": new_status}




@app.route("/admin/bookings")
@login_required("admin")
def admin_bookings():
    bookings = query_all(
        "SELECT b.*, u.username AS customer_name, u.profile_image AS customer_profile_image, vp.business_name "
        "FROM bookings b "
        "JOIN users u ON u.user_id = b.user_id "
        "LEFT JOIN vendor_profiles vp ON vp.vendor_id = b.vendor_id "
        "ORDER BY b.created_at DESC"
    )
    return render_template("admin/booking.html", bookings=bookings, user=session)


@app.route("/admin/booking/<int:booking_id>/cancel", methods=["POST"])
@login_required("admin")
def admin_cancel_booking(booking_id):
    booking = query_one(
        "SELECT b.user_id, vp.business_name FROM bookings b "
        "LEFT JOIN vendor_profiles vp ON vp.vendor_id = b.vendor_id "
        "WHERE b.booking_id = %s",
        (booking_id,)
    )
    execute(
        "UPDATE bookings SET status = 'cancelled' WHERE booking_id = %s",
        (booking_id,),
    )
    if booking:
        vendor_name = booking["business_name"] or "Vendor"
        msg = f"Your booking with {vendor_name} has been cancelled by the admin."
        execute("INSERT INTO notifications (user_id, message) VALUES (%s, %s)", (booking["user_id"], msg))
        
    flash("Booking cancelled.", "info")
    return redirect(url_for("admin_bookings"))


@app.route("/admin/booking/<int:booking_id>/approve", methods=["POST"])
@login_required("admin")
def admin_approve_booking(booking_id):
    booking = query_one(
        "SELECT b.user_id, vp.business_name FROM bookings b "
        "LEFT JOIN vendor_profiles vp ON vp.vendor_id = b.vendor_id "
        "WHERE b.booking_id = %s",
        (booking_id,)
    )
    execute(
        "UPDATE bookings SET status = 'confirmed' WHERE booking_id = %s",
        (booking_id,),
    )
    if booking:
        vendor_name = booking["business_name"] or "Vendor"
        msg = f"Your booking with {vendor_name} has been confirmed by the admin."
        execute("INSERT INTO notifications (user_id, message) VALUES (%s, %s)", (booking["user_id"], msg))
        
    flash("Booking approved successfully.", "success")
    return redirect(url_for("admin_bookings"))


@app.route("/admin/revenue")
@login_required("admin")
def admin_revenue():
    revenue = query_all(
        "SELECT DATE_FORMAT(created_at, '%%Y-%%m') AS month, "
        "SUM(total_amount) AS revenue, COUNT(*) AS booking_count "
        "FROM bookings WHERE status IN ('approved', 'confirmed', 'completed') "
        "GROUP BY month ORDER BY month DESC"
    )
    
    for r in revenue:
        r['revenue'] = float(r['revenue']) if r['revenue'] is not None else 0.0
    
    cat_rev_raw = query_all(
        "SELECT event_type, SUM(total_amount) AS revenue "
        "FROM bookings WHERE status IN ('approved', 'confirmed', 'completed') "
        "GROUP BY event_type"
    )
    
    total_gross = sum(float(r['revenue']) for r in cat_rev_raw)
    
    categories_data = []
    category_meta = {
        'wedding': {'label': 'Weddings', 'icon': 'fa-rings-wedding', 'color': '#3b82f6'},
        'corporate': {'label': 'Corporate', 'icon': 'fa-briefcase', 'color': '#f97316'},
        'birthday': {'label': 'Birthdays', 'icon': 'fa-cake-candles', 'color': '#a855f7'},
        'anniversary': {'label': 'Anniversaries', 'icon': 'fa-heart', 'color': '#ef4444'},
        'babyshower': {'label': 'Baby Showers', 'icon': 'fa-baby', 'color': '#06b6d4'},
        'party': {'label': 'Parties', 'icon': 'fa-champagne-glasses', 'color': '#10b981'},
        'movie': {'label': 'Movies', 'icon': 'fa-film', 'color': '#64748b'},
        'cultural': {'label': 'Cultural', 'icon': 'fa-masks-theater', 'color': '#e11d48'},
    }
    
    for r in cat_rev_raw:
        if not r['event_type']:
            continue
        etype = r['event_type'].lower()
        meta = category_meta.get(etype, {'label': r['event_type'].capitalize(), 'icon': 'fa-calendar-day', 'color': '#3b82f6'})
        rev = float(r['revenue'])
        pct = int((rev / total_gross * 100)) if total_gross > 0 else 0
        categories_data.append({
            'label': meta['label'],
            'icon': meta['icon'],
            'color': meta['color'],
            'revenue': rev,
            'percentage': pct
        })
        
    categories_data = sorted(categories_data, key=lambda x: x['revenue'], reverse=True)
    
    if not categories_data:
        categories_data = [
            {'label': 'Weddings', 'icon': 'fa-rings-wedding', 'color': '#3b82f6', 'revenue': 0.0, 'percentage': 0},
            {'label': 'Corporate', 'icon': 'fa-briefcase', 'color': '#f97316', 'revenue': 0.0, 'percentage': 0},
            {'label': 'Birthdays', 'icon': 'fa-cake-candles', 'color': '#a855f7', 'revenue': 0.0, 'percentage': 0},
        ]
        
    return render_template(
        "admin/revenue.html",
        revenue=revenue,
        categories_data=categories_data,
        user=session
    )


@app.route("/admin/settings", methods=["GET", "POST"])
@login_required("admin")
def admin_settings():
    if request.method == "POST":
        # Handle admin avatar upload
        user_id = session.get("user_id")
        if user_id:
            if 'admin_avatar' in request.files:
                file = request.files['admin_avatar']
                if file and file.filename != '':
                    if allowed_file(file.filename):
                        # Ensure size is <= 800KB
                        file.seek(0, os.SEEK_END)
                        size = file.tell()
                        file.seek(0)
                        if size <= 800 * 1024:
                            os.makedirs(UPLOAD_FOLDER, exist_ok=True)
                            filename = secure_filename("admin_{}_{}".format(user_id, file.filename))
                            file_path = os.path.join(UPLOAD_FOLDER, filename)
                            file.save(file_path)
                            profile_image = "/static/uploads/{}".format(filename)
                            
                            # Save in user's profile
                            execute(
                                "UPDATE users SET profile_image = %s WHERE user_id = %s",
                                (profile_image, user_id),
                            )
                            session["profile_image"] = profile_image
                        else:
                            flash("File size exceeds 800KB limit.", "error")
                            return redirect(url_for("admin_settings"))
                    else:
                        flash("Invalid file type. Allowed formats: PNG, JPG, JPEG, GIF, WEBP.", "error")
                        return redirect(url_for("admin_settings"))

        # Save settings variables
        for key in request.form:
            if key.startswith("setting_"):
                setting_key = key.replace("setting_", "", 1)
                execute(
                    "INSERT INTO admin_settings (setting_key, setting_value) "
                    "VALUES (%s, %s) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
                    (setting_key, request.form.get(key)),
                )
        flash("Settings saved.", "success")
        return redirect(url_for("admin_settings"))

    rows = query_all("SELECT setting_key, setting_value FROM admin_settings")
    settings = {r["setting_key"]: r["setting_value"] for r in rows}
    return render_template("admin/settings.html", settings=settings, user=session)


if __name__ == "__main__":
    app.run(debug=True)
