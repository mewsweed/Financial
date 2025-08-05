const express = require('express');
const sql = require('mssql');
const path = require('path');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// ตั้งค่า session middleware
app.use(session({
    secret: 'your_secret_key', // ควรเป็นข้อความสุ่มที่ซับซ้อน
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // ตั้งเป็น true เมื่อใช้ HTTPS
        httpOnly: true 
    }
}));

// ตั้งค่า EJS เป็น template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware สำหรับ parse JSON และ form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ให้บริการไฟล์ static (CSS, JS, รูปภาพ)
app.use(express.static(path.join(__dirname, 'public')));

// ตั้งค่าการเชื่อมต่อฐานข้อมูล SQL Server
const dbConfig = {
    user: 'sa', // ใช้ sa account
    password: 'Sa123456!', // password ที่เราเพิ่งตั้ง
    server: 'localhost',
    port: 1433,
    database: 'TestDB',
    connectionTimeout: 30000,
    requestTimeout: 30000,
    options: {
        encrypt: false,
        trustServerCertificate: true,
        enableArithAbort: true
        // ลบ integratedSecurity เพราะใช้ SQL Authentication แทน
    }
};

// Route หลัก
app.get('/', (req, res) => {
    res.render('index', { 
        title: 'หน้าแรก',
        message: 'ยินดีต้อนรับสู่ Node.js แอปแรกของคุณ!' 
    });
});

// Route สำหรับหน้า Login
app.get('/login', (req, res) => {
    res.render('login', { 
        title: 'เข้าสู่ระบบ'
    });
});

// Route สำหรับการ Login (POST)
app.post('/login', async (req, res) => {
    const { username, password, remember } = req.body;
    
    try {
        // เชื่อมต่อฐานข้อมูล
        await sql.connect(dbConfig);
        
        // ตรวจสอบ username และ password จากฐานข้อมูล
        const result = await sql.query`
            SELECT 
                UserID, 
                Username, 
                FullName, 
                Email,
                Role,
                IsActive,
                LastLogin
            FROM Users 
            WHERE Username = ${username} 
            AND Password = ${password}
            AND IsActive = 1
        `;
        
        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            
            // อัปเดต LastLogin
            await sql.query`
                UPDATE Users 
                SET LastLogin = GETDATE() 
                WHERE UserID = ${user.UserID}
            `;
            
            // สร้าง session หรือ token (ในตัวอย่างนี้เก็บใน memory)
            // บันทึกข้อมูลผู้ใช้ลงใน session
            req.session.user = {
                id: user.UserID,
                username: user.Username,
                fullName: user.FullName,
                email: user.Email,
                role: user.Role
            };
            // ในการใช้งานจริงควรใช้ express-session
            
            res.json({
                success: true,
                message: `ยินดีต้อนรับ ${user.FullName}!`,
                user: {
                    id: user.UserID,
                    username: user.Username,
                    fullName: user.FullName,
                    email: user.Email,
                    role: user.Role
                },
                redirectUrl: '/dashboard'
            });
            
        } else {
            res.status(401).json({
                success: false,
                message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง'
            });
        }
        
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในระบบ กรุณาลองใหม่อีกครั้ง'
        });
    } finally {
        await sql.close();
    }
});

// Route สำหรับ Dashboard (หลังจาก Login สำเร็จ)
app.get('/dashboard', (req, res) => {
    // ตรวจสอบว่ามี session user หรือไม่
    if (req.session.user) {
        // ถ้ามี ให้นำข้อมูลมาใช้
        res.render('dashboard', {
            title: 'Dashboard',
            user: {
                fullName: req.session.user.fullName, 
                role: req.session.user.role
            }
        });
    } else {
        // ถ้าไม่มี ให้ redirect กลับไปหน้า login
        res.redirect('/login');
    }
});

// Route สำหรับ Logout
app.get('/logout', (req, res) => {
    // ลบ session
    res.redirect('/login');
});

// Route สำหรับ Register (หน้าสมัครสมาชิก)
app.get('/register', (req, res) => {
    res.render('register', {
        title: 'สมัครสมาชิก'
    });
});

// Route สำหรับการสมัครสมาชิก (POST)
app.post('/register', async (req, res) => {
    const { username, password, fullName, email } = req.body;
    
    try {
        await sql.connect(dbConfig);
        
        // ตรวจสอบว่า username ซ้ำหรือไม่
        const checkUser = await sql.query`
            SELECT Username FROM Users WHERE Username = ${username}
        `;
        
        if (checkUser.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว'
            });
        }
        
        // ตรวจสอบว่า email ซ้ำหรือไม่
        const checkEmail = await sql.query`
            SELECT Email FROM Users WHERE Email = ${email}
        `;
        
        if (checkEmail.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'อีเมลนี้มีอยู่ในระบบแล้ว'
            });
        }
        
        // เพิ่มผู้ใช้ใหม่
        await sql.query`
            INSERT INTO Users (Username, Password, FullName, Email, Role, IsActive, CreatedDate)
            VALUES (${username}, ${password}, ${fullName}, ${email}, 'User', 1, GETDATE())
        `;
        
        res.json({
            success: true,
            message: 'สมัครสมาชิกสำเร็จ! กรุณาเข้าสู่ระบบ',
            redirectUrl: '/login'
        });
        
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({
            success: false,
            message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก'
        });
    } finally {
        await sql.close();
    }
});

// Route สำหรับตรวจสอบ Username ว่าใช้ได้หรือไม่
app.post('/check-username', async (req, res) => {
    const { username } = req.body;
    
    try {
        // ตรวจสอบรูปแบบ username
        const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(username)) {
            return res.json({
                available: false,
                message: 'รูปแบบชื่อผู้ใช้ไม่ถูกต้อง'
            });
        }
        
        await sql.connect(dbConfig);
        
        const result = await sql.query`
            SELECT Username FROM Users WHERE Username = ${username}
        `;
        
        res.json({
            available: result.recordset.length === 0,
            message: result.recordset.length === 0 ? 'ชื่อผู้ใช้นี้ใช้ได้' : 'ชื่อผู้ใช้นี้ถูกใช้แล้ว'
        });
        
    } catch (err) {
        console.error('Check username error:', err);
        res.status(500).json({
            available: false,
            message: 'ไม่สามารถตรวจสอบชื่อผู้ใช้ได้'
        });
    } finally {
        await sql.close();
    }
});

// Route สำหรับทดสอบการเชื่อมต่อฐานข้อมูลหลายวิธี
app.get('/test-db', async (req, res) => {
    const testConfigs = [
        // วิธีที่ 1: SQL Authentication ด้วย sa
        {
            name: 'localhost:1433 (SQL Auth - sa)',
            config: {
                user: 'sa',
                password: 'Sa123456!',
                server: 'localhost',
                port: 1433,
                database: 'master',
                connectionTimeout: 10000,
                options: {
                    encrypt: false,
                    trustServerCertificate: true,
                    enableArithAbort: true
                }
            }
        },
        // วิธีที่ 2: Windows Authentication
        {
            name: 'localhost:1433 (Windows Auth)',
            config: {
                server: 'localhost',
                port: 1433,
                database: 'master',
                connectionTimeout: 10000,
                options: {
                    encrypt: false,
                    trustServerCertificate: true,
                    enableArithAbort: true,
                    integratedSecurity: true
                }
            }
        },
        // วิธีที่ 3: ลองด้วย instance name
        {
            name: 'localhost\\SQLEXPRESS2019 (Windows Auth)',
            config: {
                server: 'localhost\\SQLEXPRESS2019',
                database: 'master',
                connectionTimeout: 10000,
                options: {
                    encrypt: false,
                    trustServerCertificate: true,
                    enableArithAbort: true,
                    integratedSecurity: true
                }
            }
        }
    ];
    
    let results = [];
    let foundConnection = null;
    
    for (let testConfig of testConfigs) {
        try {
            console.log(`Testing connection to: ${testConfig.name}`);
            await sql.connect(testConfig.config);
            
            const result = await sql.query(`
                SELECT 
                    GETDATE() as CurrentTime, 
                    @@SERVERNAME as ServerName, 
                    USER_NAME() as CurrentUser,
                    DB_NAME() as CurrentDatabase
            `);
            
            foundConnection = {
                method: testConfig.name,
                success: true,
                data: result.recordset[0]
            };
            
            results.push(foundConnection);
            await sql.close();
            break; // หยุดเมื่อเจอวิธีที่ใช้ได้
            
        } catch (err) {
            console.log(`Failed to connect with ${testConfig.name}: ${err.message}`);
            results.push({
                method: testConfig.name,
                success: false,
                error: err.message
            });
            
            try {
                await sql.close();
            } catch (closeErr) {
                // ignore close errors
            }
        }
    }
    
    if (foundConnection) {
        res.json({
            success: true,
            message: `🎉 เชื่อมต่อฐานข้อมูลสำเร็จ!`,
            connectionMethod: foundConnection.method,
            data: foundConnection.data,
            nextSteps: [
                'ตอนนี้สามารถเชื่อมต่อฐานข้อมูลได้แล้ว',
                'ให้อัปเดตการตั้งค่า dbConfig ในโค้ดตามวิธีที่ใช้ได้',
                'สร้างฐานข้อมูลและตารางสำหรับโปรเจค',
                'เริ่มพัฒนาฟีเจอร์ต่างๆ ได้เลย!'
            ],
            allAttempts: results.length
        });
    } else {
        res.status(500).json({
            success: false,
            message: '❌ ไม่สามารถเชื่อมต่อฐานข้อมูลได้ด้วยวิธีใดๆ',
            troubleshooting: [
                '1. ตรวจสอบว่าได้เปิด Mixed Mode Authentication แล้ว',
                '2. ตรวจสอบว่าได้เปิดใช้งาน sa account แล้ว',
                '3. ตรวจสอบ password ของ sa account',
                '4. Restart SQL Server Service หลังจากเปลี่ยน settings',
                '5. ลองเชื่อมต่อด้วย SSMS ก่อนเพื่อยืนยัน credentials'
            ],
            allAttempts: results
        });
    }
});

// Route สำหรับดึงข้อมูลจากฐานข้อมูล (ตัวอย่าง)
app.get('/users', async (req, res) => {
    try {
        await sql.connect(dbConfig);
        
        // แทนที่ 'Users' ด้วยชื่อตารางที่คุณมี
        const result = await sql.query('SELECT * FROM Users');
        
        res.render('users', {
            title: 'รายชื่อผู้ใช้',
            users: result.recordset
        });
    } catch (err) {
        console.error('Database query error:', err);
        res.render('error', {
            title: 'เกิดข้อผิดพลาด',
            error: err.message
        });
    } finally {
        await sql.close();
    }
});

// เริ่มต้น server
app.listen(PORT, () => {
    console.log(`Server กำลังทำงานที่ http://localhost:${PORT}`);
});

// จัดการ error ที่ไม่ได้คาดหวัง
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
});