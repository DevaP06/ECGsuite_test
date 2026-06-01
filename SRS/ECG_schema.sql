-- =====================================================
-- ECGENIUS DATABASE SCHEMA
-- Version 1.0
-- =====================================================

CREATE TABLE users (
    user_id BIGSERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash TEXT NOT NULL,

    role VARCHAR(30) NOT NULL CHECK (
        role IN (
            'PATIENT',
            'PHC_DOCTOR',
            'CARDIOLOGIST',
            'ADMIN'
        )
    ),

    status VARCHAR(20) DEFAULT 'ACTIVE',

    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================

CREATE TABLE patients (
    patient_id BIGSERIAL PRIMARY KEY,

    user_id BIGINT UNIQUE NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    abha_id VARCHAR(50),

    age INTEGER,
    sex VARCHAR(10),

    blood_group VARCHAR(10),

    address TEXT,
    district VARCHAR(100),
    state VARCHAR(100),

    emergency_contact VARCHAR(20),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================

CREATE TABLE phc (
    phc_id BIGSERIAL PRIMARY KEY,

    phc_name VARCHAR(200) NOT NULL,

    district VARCHAR(100),
    state VARCHAR(100),

    address TEXT,
    contact_number VARCHAR(20),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================

CREATE TABLE phc_doctors (
    doctor_id BIGSERIAL PRIMARY KEY,

    user_id BIGINT UNIQUE NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    phc_id BIGINT
        REFERENCES phc(phc_id),

    license_number VARCHAR(100) UNIQUE,
    specialization VARCHAR(100),
    designation VARCHAR(100),

    joining_date DATE
);

-- =====================================================

CREATE TABLE cardiologists (
    cardiologist_id BIGSERIAL PRIMARY KEY,

    user_id BIGINT UNIQUE NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    license_number VARCHAR(100) UNIQUE,

    hospital_name VARCHAR(200),

    specialization VARCHAR(100),

    years_experience INTEGER
);

-- =====================================================

CREATE TABLE admins (
    admin_id BIGSERIAL PRIMARY KEY,

    user_id BIGINT UNIQUE NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    designation VARCHAR(100),
    access_level VARCHAR(50)
);

-- =====================================================

CREATE TABLE model_versions (
    model_id BIGSERIAL PRIMARY KEY,

    model_name VARCHAR(100) NOT NULL,

    version_name VARCHAR(50) NOT NULL,

    framework VARCHAR(50),

    model_size_mb DECIMAL(10,2),

    deployment_date TIMESTAMP,

    status VARCHAR(20),

    notes TEXT
);

-- =====================================================

CREATE TABLE ecg_records (

    ecg_id BIGSERIAL PRIMARY KEY,

    patient_id BIGINT NOT NULL
        REFERENCES patients(patient_id)
        ON DELETE CASCADE,

    uploaded_by BIGINT
        REFERENCES users(user_id),

    file_name VARCHAR(255),

    file_type VARCHAR(20),

    file_path TEXT NOT NULL,

    upload_method VARCHAR(30),

    recorded_at TIMESTAMP,

    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    quality_score DECIMAL(5,2),

    processing_status VARCHAR(30)
);

-- =====================================================

CREATE TABLE patient_history (

    history_id BIGSERIAL PRIMARY KEY,

    patient_id BIGINT NOT NULL
        REFERENCES patients(patient_id)
        ON DELETE CASCADE,

    symptoms TEXT,

    risk_factors TEXT,

    comorbidities TEXT,

    vitals JSONB,

    questionnaire_version VARCHAR(50),

    recorded_by BIGINT
        REFERENCES users(user_id),

    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================

CREATE TABLE ecg_analysis (

    analysis_id BIGSERIAL PRIMARY KEY,

    ecg_id BIGINT NOT NULL
        REFERENCES ecg_records(ecg_id)
        ON DELETE CASCADE,

    model_id BIGINT
        REFERENCES model_versions(model_id),

    analysis_status VARCHAR(30),

    analysis_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    processing_time_sec DECIMAL(10,3),

    confidence_score DECIMAL(6,4),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================

CREATE TABLE diagnosis (

    diagnosis_id BIGSERIAL PRIMARY KEY,

    analysis_id BIGINT NOT NULL
        REFERENCES ecg_analysis(analysis_id)
        ON DELETE CASCADE,

    condition_code VARCHAR(50),

    condition_name VARCHAR(255) NOT NULL,

    probability DECIMAL(8,5),

    symptom_score DECIMAL(8,5),

    risk_score DECIMAL(8,5),

    rule_score DECIMAL(8,5),

    final_score DECIMAL(8,5),

    confidence_tier VARCHAR(20),

    urgency_tier VARCHAR(20),

    is_emergency BOOLEAN DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================

CREATE TABLE ecg_explanations (

    explanation_id BIGSERIAL PRIMARY KEY,

    analysis_id BIGINT UNIQUE NOT NULL
        REFERENCES ecg_analysis(analysis_id)
        ON DELETE CASCADE,

    heatmap_path TEXT,

    waveform_highlight_path TEXT,

    lead_importance_json JSONB,

    pqrst_summary JSONB,

    ablation_check_result TEXT,

    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================

CREATE TABLE clinical_reports (

    report_id BIGSERIAL PRIMARY KEY,

    analysis_id BIGINT UNIQUE NOT NULL
        REFERENCES ecg_analysis(analysis_id)
        ON DELETE CASCADE,

    generated_by BIGINT
        REFERENCES users(user_id),

    pdf_path TEXT NOT NULL,

    report_version VARCHAR(30),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================

CREATE TABLE recommendations (

    recommendation_id BIGSERIAL PRIMARY KEY,

    diagnosis_id BIGINT NOT NULL
        REFERENCES diagnosis(diagnosis_id)
        ON DELETE CASCADE,

    recommendation_type VARCHAR(50),

    description TEXT,

    resource_filtered BOOLEAN DEFAULT FALSE,

    priority_level VARCHAR(30),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================

CREATE TABLE specialist_reviews (

    review_id BIGSERIAL PRIMARY KEY,

    analysis_id BIGINT NOT NULL
        REFERENCES ecg_analysis(analysis_id)
        ON DELETE CASCADE,

    cardiologist_id BIGINT NOT NULL
        REFERENCES cardiologists(cardiologist_id),

    review_status VARCHAR(30),

    review_notes TEXT,

    expert_diagnosis TEXT,

    override_reason TEXT,

    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================

CREATE TABLE phc_resources (

    resource_id BIGSERIAL PRIMARY KEY,

    phc_id BIGINT NOT NULL
        REFERENCES phc(phc_id)
        ON DELETE CASCADE,

    resource_type VARCHAR(50),

    resource_name VARCHAR(255),

    availability_status VARCHAR(30),

    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================

CREATE TABLE notifications (

    notification_id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    title VARCHAR(255),

    message TEXT,

    notification_type VARCHAR(50),

    status VARCHAR(30),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    read_at TIMESTAMP
);

-- =====================================================

CREATE TABLE audit_logs (

    log_id BIGSERIAL PRIMARY KEY,

    user_id BIGINT
        REFERENCES users(user_id),

    entity_type VARCHAR(100),

    entity_id BIGINT,

    action VARCHAR(100),

    old_value JSONB,

    new_value JSONB,

    ip_address VARCHAR(50),

    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_ecg_patient
ON ecg_records(patient_id);

CREATE INDEX idx_analysis_ecg
ON ecg_analysis(ecg_id);

CREATE INDEX idx_diagnosis_analysis
ON diagnosis(analysis_id);

CREATE INDEX idx_review_analysis
ON specialist_reviews(analysis_id);

CREATE INDEX idx_audit_user
ON audit_logs(user_id);

CREATE INDEX idx_notification_user
ON notifications(user_id);

CREATE INDEX idx_history_patient
ON patient_history(patient_id);

CREATE INDEX idx_report_analysis
ON clinical_reports(analysis_id);

-- =====================================================
-- END OF ECGENIUS DATABASE SCHEMA
-- =====================================================