-- Insert Parents and Children Data
-- Run this after setting up the schema in Supabase dashboard

-- Use the default church_id
-- Replace '00000000-0000-0000-0000-000000000001' with your actual church_id if different

-- ============================================
-- INSERT PARENTS
-- ============================================

-- Parent 1: Coletta Njeri Mwangangi
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS001', 'Coletta Njeri Mwangangi', 'coletmwangangi@gmail.com', '0728811866', 'Primary', true, '2024-04-28 21:51:34')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 2: Caroline Musya
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS002', 'Caroline Musya', 'cmukulu@gmail.com', '0731662120', 'Primary', true, '2024-04-28 22:01:13')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 3: Caroline Chege
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS003', 'Caroline Chege', 'carolinewchege@gmail.com', '0711859532', 'Primary', true, '2024-04-28 22:08:47')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 4: Genevieve Achieng
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS004', 'Genevieve Achieng', 'gennieachie@gmail.com', '0721145413', 'Primary', true, '2024-04-28 22:14:50')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 5: Judy Wawira
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS005', 'Judy Wawira', 'j.wawira01@gmail.com', '0717262734', 'Primary', true, '2024-04-29 01:16:57')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 6: Irene Mapelu
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS006', 'Irene Mapelu', 'irnaanyu@gmail.com', '0720570306', 'Primary', true, '2024-04-29 08:43:20')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 7: Lorraine Achieng
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS007', 'Lorraine Achieng', 'Lachieng2008@gmail.com', '0757846206', 'Primary', true, '2024-04-29 11:49:04')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 8: Daniel Mutwiri & Eve Ouma
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS008', 'Daniel Mutwiri & Eve Ouma', 'eveouma86@gmail.com', '0707639662', 'Primary', true, '2024-04-30 14:09:02')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 9: RUTH NAMAEMBA KHISA
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS009', 'RUTH NAMAEMBA KHISA', 'Khisar@yahoo.com', '0725056771', 'Primary', true, '2024-04-30 17:44:23')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 10: Wanjuki Kiarago
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS010', 'Wanjuki Kiarago', 'jkiarago@gmail.com', '0782105369', 'Primary', true, '2024-04-30 17:57:26')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 11: CAROLINE KAGIA
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS011', 'CAROLINE KAGIA', 'carolinekagiawellness@gmail.com', '0757576980', 'Primary', true, '2024-04-30 18:45:22')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 12: Getrude Jeruto
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS012', 'Getrude Jeruto', 'gkerich88@gmail.com', '0726585806', 'Primary', true, '2024-04-30 18:54:31')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 13: David Maingi Tirima and Irene Maingi
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS013', 'David Maingi Tirima and Irene Maingi', 'tirimadavid@gmail.com', '0722495695', 'Primary', true, '2024-04-30 19:38:47')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 14: Tony Menza
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS014', 'Tony Menza', 'tonymenza7@gmail.com', '0725455662', 'Primary', true, '2024-04-30 20:00:14')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 15: Amos Odidi
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS015', 'Amos Odidi', 'amos.odidi@gmail.com', '0721936885', 'Primary', true, '2024-04-30 20:57:55')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 16: EVERLYNE WANJIRU MURIGU
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS016', 'EVERLYNE WANJIRU MURIGU', 'EVESHIRO92@GMAIL.COM', '0717393096', 'Primary', true, '2024-04-30 22:55:12')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 17: Irene wambani muloma
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS017', 'Irene wambani muloma', 'irenemuloma@gmail.com', '0729542619', 'Primary', true, '2024-05-01 09:22:01')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 18: Mbeti Karen Florence
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS018', 'Mbeti Karen Florence', 'karenmbeti@gmail.com', '0795096223', 'Primary', true, '2024-05-01 09:26:57')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 19: Ruth Mushi Amwayi
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS019', 'Ruth Mushi Amwayi', 'ramwayi@safaricom.co.ke', '0722507464', 'Primary', true, '2024-05-01 09:56:55')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 20: Martha Muthoni
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS020', 'Martha Muthoni', 'muthonikiyo@gmail.com', '0728994723', 'Primary', true, '2024-05-01 10:13:00')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 21: Gracejoy Wanjohi
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS021', 'Gracejoy Wanjohi', 'gjoykawan@yahoo.com', '0720409637', 'Primary', true, '2024-05-01 10:35:44')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 22: Joyce Gichinga
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS022', 'Joyce Gichinga', 'gichingajoyce08@gmail.com', '0798078496', 'Primary', true, '2024-05-01 12:24:11')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 23: Gladys Muturi
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS023', 'Gladys Muturi', 'gladysmuturin@gmail.com', '0722731849', 'Primary', true, '2024-05-01 19:23:50')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 24: Violet Vihenda (first entry)
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS024', 'Violet Vihenda', 'vvihenda2@gmail.com', '0729483322', 'Primary', true, '2024-05-01 23:12:22')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 25: Nick Kamau & Mwende Kamau
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS025', 'Nick Kamau & Mwende Kamau', 'judymwende.mwende@gmail.com', '0723754123', 'Primary', true, '2024-05-02 09:36:04')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 26: Richard Itambo | Wanjiku Itambo
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS026', 'Richard Itambo | Wanjiku Itambo', 'richardmwandoe@gmail.com', '0724852901', 'Primary', true, '2024-05-02 15:00:01')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 27: Eva Ngovi
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS027', 'Eva Ngovi', 'eva.ngovi@gmail.com', '0722819310', 'Primary', true, '2024-05-02 17:10:39')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 28: Mary Ndunge Kioko
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS028', 'Mary Ndunge Kioko', 'maryk.yona@gmail.com', '0720760883', 'Primary', true, '2024-05-02 18:04:51')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 29: Rose Njeri isika
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS029', 'Rose Njeri isika', 'rnkahurani@gmail.com', '0707491016', 'Primary', true, '2024-05-04 18:16:44')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 30: Sophy Inyanji Mukhongo
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS030', 'Sophy Inyanji Mukhongo', 'sophiemukhongo@gmail.com', '0718882221', 'Primary', true, '2024-05-04 19:17:24')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- Parent 31: Yvonne Wawira Kinyua
INSERT INTO guardians (church_id, parent_id, name, email, phone, relationship, is_primary, created_at) 
VALUES ('00000000-0000-0000-0000-000000000001', 'RS031', 'Yvonne Wawira Kinyua', 'Yvonne.wawira@gmail.com', '0728826070', 'Primary', true, '2024-05-04 19:50:09')
ON CONFLICT (church_id, parent_id) DO NOTHING;

-- ============================================
-- INSERT CHILDREN
-- ============================================
-- Note: You need to get the guardian_id from the guardians table after inserting parents
-- These use subqueries to find the guardian_id by email

-- Coletta Njeri Mwangangi's children (RS001)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS001/01', 'Nathan Mugisha', '2014-02-05', '2024-04-28 21:51:34'
FROM guardians WHERE email = 'coletmwangangi@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS001/02', 'Kyle King', '2017-06-10', '2024-04-28 21:53:14'
FROM guardians WHERE email = 'coletmwangangi@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS001/03', 'Bella McKenna', '2018-07-22', '2024-04-28 21:54:11'
FROM guardians WHERE email = 'coletmwangangi@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Caroline Musya's children (RS002)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS002/01', 'Adrian Mwandawiro', '2012-08-29', '2024-04-28 22:01:13'
FROM guardians WHERE email = 'cmukulu@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Caroline Chege's children (RS003)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS003/01', 'Zuri Mwari', '2013-12-22', '2024-04-28 22:08:47'
FROM guardians WHERE email = 'carolinewchege@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Genevieve Achieng's children (RS004)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS004/01', 'Fifine Keira', '2016-03-12', '2024-04-28 22:14:50'
FROM guardians WHERE email = 'gennieachie@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS004/02', 'Amalu Merab', '2016-10-03', '2024-04-28 22:15:53'
FROM guardians WHERE email = 'gennieachie@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS004/03', 'Abrielle Naysa', '2019-09-22', '2024-04-28 22:16:42'
FROM guardians WHERE email = 'gennieachie@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Judy Wawira's children (RS005)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS005/01', 'Jabari Kyalo', '2012-10-15', '2024-04-29 01:16:57'
FROM guardians WHERE email = 'j.wawira01@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Irene Mapelu's children (RS006)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS006/01', 'Akim Sifa', '2013-09-10', '2024-04-29 08:43:20'
FROM guardians WHERE email = 'irnaanyu@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS006/02', 'Alicah Mayah', '2015-09-20', '2024-04-29 08:44:11'
FROM guardians WHERE email = 'irnaanyu@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS006/03', 'Amira Folorunso', '2017-05-30', '2024-04-29 08:45:11'
FROM guardians WHERE email = 'irnaanyu@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Lorraine Achieng's children (RS007)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS007/01', 'Carl Macnehemiah', '2013-04-24', '2024-04-29 11:49:04'
FROM guardians WHERE email = 'Lachieng2008@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS007/02', 'Ariannah Rachael Hawii', '2016-01-06', '2024-04-29 11:51:19'
FROM guardians WHERE email = 'Lachieng2008@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS007/03', 'Gabriel Hawi', '2020-05-17', '2024-04-29 11:52:14'
FROM guardians WHERE email = 'Lachieng2008@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS007/04', 'Wendy Yuliana Malaika', '2018-02-03', '2024-04-29 11:53:53'
FROM guardians WHERE email = 'Lachieng2008@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Daniel Mutwiri & Eve Ouma's children (RS008)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS008/01', 'Jonathan Mutwiri', '2017-09-28', '2024-04-30 14:09:02'
FROM guardians WHERE email = 'eveouma86@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS008/02', 'Olivia Mutwiri', '2019-06-24', '2024-04-30 14:40:14'
FROM guardians WHERE email = 'eveouma86@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS008/03', 'Noah Mutwiri', '2021-01-21', '2024-04-30 14:40:52'
FROM guardians WHERE email = 'eveouma86@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- RUTH NAMAEMBA KHISA's children (RS009)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS009/01', 'Kylie Imani', '2012-06-07', '2024-04-30 17:44:23'
FROM guardians WHERE email = 'Khisar@yahoo.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS009/02', 'Zarinah Zolani', '2016-11-17', '2024-04-30 17:45:21'
FROM guardians WHERE email = 'Khisar@yahoo.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Wanjuki Kiarago's children (RS010)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS010/01', 'Naima T. Matambanadzo', '2011-08-22', '2024-04-30 17:57:26'
FROM guardians WHERE email = 'jkiarago@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS010/02', 'Judah T. Matambanadzo', '2014-09-23', '2024-04-30 17:58:51'
FROM guardians WHERE email = 'jkiarago@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- CAROLINE KAGIA's children (RS011)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS011/01', 'KELLY KAGIA', '2015-05-01', '2024-04-30 18:45:22'
FROM guardians WHERE email = 'carolinekagiawellness@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Getrude Jeruto's children (RS012)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS012/01', 'Palmer KeKe Jepkorir', '2017-11-16', '2024-04-30 18:54:31'
FROM guardians WHERE email = 'gkerich88@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- David Maingi Tirima and Irene Maingi's children (RS013)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS013/01', 'Gabriel Maingi', '2015-05-04', '2024-04-30 19:38:47'
FROM guardians WHERE email = 'tirimadavid@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Tony Menza's children (RS014) - Note: Dates without year, using estimated year 2017
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS014/01', 'Chessy Wairimu', '2017-04-10', '2024-04-30 20:00:14'
FROM guardians WHERE email = 'tonymenza7@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS014/02', 'Elssy Wangui', '2017-09-20', '2024-04-30 20:01:12'
FROM guardians WHERE email = 'tonymenza7@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Amos Odidi's children (RS015)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS015/01', 'Cayden Dylan', '2012-10-25', '2024-04-30 20:57:55'
FROM guardians WHERE email = 'amos.odidi@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- EVERLYNE WANJIRU MURIGU's children (RS016)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS016/01', 'CALEB BARAKA MWANGI', '2018-03-23', '2024-04-30 22:55:12'
FROM guardians WHERE email = 'EVESHIRO92@GMAIL.COM' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Irene wambani muloma's children (RS017)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS017/01', 'Janet Naiga Wanjau', '2011-05-09', '2024-05-01 09:22:01'
FROM guardians WHERE email = 'irenemuloma@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Mbeti Karen Florence's children (RS018)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS018/01', 'Kylee Wanna Kuli', '2012-01-27', '2024-05-01 09:26:57'
FROM guardians WHERE email = 'karenmbeti@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Ruth Mushi Amwayi's children (RS019)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS019/01', 'Nemayian Koitamet Kina', '2014-11-25', '2024-05-01 09:56:55'
FROM guardians WHERE email = 'ramwayi@safaricom.co.ke' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Martha Muthoni's children (RS020)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS020/01', 'Imani Lucy Mwanduka', '2020-12-01', '2024-05-01 10:13:00'
FROM guardians WHERE email = 'muthonikiyo@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Gracejoy Wanjohi's children (RS021)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS021/01', 'Ivan Jabari', '2015-12-11', '2024-05-01 10:35:44'
FROM guardians WHERE email = 'gjoykawan@yahoo.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Joyce Gichinga's children (RS022)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS022/01', 'Marsha waitherero wangari', '2016-03-06', '2024-05-01 12:24:11'
FROM guardians WHERE email = 'gichingajoyce08@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Gladys Muturi's children (RS023)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS023/01', 'Arianna Ikenye', '2017-08-07', '2024-05-01 19:23:50'
FROM guardians WHERE email = 'gladysmuturin@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS023/02', 'Wendo Ikenye', '2021-10-22', '2024-05-01 23:16:48'
FROM guardians WHERE email = 'gladysmuturin@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Violet Vihenda's children (RS024)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS024/01', 'Ethan Owera Omondi', '2012-09-26', '2024-05-01 23:12:22'
FROM guardians WHERE email = 'vvihenda2@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS024/02', 'Ayanah Ava Omondi', '2018-08-12', '2024-05-01 23:13:35'
FROM guardians WHERE email = 'vvihenda2@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Nick Kamau & Mwende Kamau's children (RS025)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS025/01', 'Joshua Thayu Kamau', '2015-04-15', '2024-05-02 09:36:04'
FROM guardians WHERE email = 'judymwende.mwende@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS025/02', 'Judah Mutana Kamau', '2017-04-01', '2024-05-02 09:37:17'
FROM guardians WHERE email = 'judymwende.mwende@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS025/03', 'Levi Enzi Kamau', '2019-10-05', '2024-05-02 09:38:31'
FROM guardians WHERE email = 'judymwende.mwende@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Richard Itambo | Wanjiku Itambo's children (RS026)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS026/01', 'Jaden Itambo', '2014-11-24', '2024-05-02 15:00:01'
FROM guardians WHERE email = 'richardmwandoe@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS026/02', 'Tal Itambo', '2017-01-06', '2024-05-02 15:01:36'
FROM guardians WHERE email = 'richardmwandoe@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Eva Ngovi's children (RS027)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS027/01', 'Genesis Tunu-Nuru', '2021-06-20', '2024-05-02 17:10:39'
FROM guardians WHERE email = 'eva.ngovi@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Mary Ndunge Kioko's children (RS028)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS028/01', 'Iden Hawi Yona', '2011-07-07', '2024-05-02 18:04:51'
FROM guardians WHERE email = 'maryk.yona@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Rose Njeri isika's children (RS029)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS029/01', 'Nathan isika', '2012-01-09', '2024-05-04 18:16:44'
FROM guardians WHERE email = 'rnkahurani@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Sophy Inyanji Mukhongo's children (RS030)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS030/01', 'Caidyn Israel Mukhongo', '2018-05-09', '2024-05-04 19:17:24'
FROM guardians WHERE email = 'sophiemukhongo@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- Yvonne Wawira Kinyua's children (RS031)
INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS031/01', 'Ariella Kaki', '2015-04-27', '2024-05-04 19:50:09'
FROM guardians WHERE email = 'Yvonne.wawira@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

INSERT INTO children (church_id, parent_id, registration_id, name, date_of_birth, created_at)
SELECT '00000000-0000-0000-0000-000000000001', guardian_id, 'RS031/02', 'Reign Baraka', '2021-04-04', '2024-05-04 19:50:58'
FROM guardians WHERE email = 'Yvonne.wawira@gmail.com' AND church_id = '00000000-0000-0000-0000-000000000001'
ON CONFLICT (church_id, registration_id) DO NOTHING;

-- ============================================
-- AUTO-ASSIGN CHILDREN TO GROUPS BASED ON AGE
-- ============================================
-- This will assign children to appropriate groups based on their age
UPDATE children c
SET group_id = g.group_id
FROM groups g
WHERE c.church_id = g.church_id
  AND c.church_id = '00000000-0000-0000-0000-000000000001'
  AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, c.date_of_birth)) BETWEEN g.age_range_min AND g.age_range_max
  AND c.group_id IS NULL;

