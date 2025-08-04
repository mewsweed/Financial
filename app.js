const express = require('express');
const sql = require('mssql');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

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