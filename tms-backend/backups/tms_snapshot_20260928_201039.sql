--
-- PostgreSQL database dump
--

\restrict dUJsEc2cdDtkUnp0rijFDmjJgs8zoD0XPFaXF4f9hprqqgGTOZoZGEP2KFcpULT

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id bigint NOT NULL,
    entity_type character varying(32) NOT NULL,
    entity_id character varying(32) NOT NULL,
    action character varying(32) NOT NULL,
    field_name character varying(64),
    old_value text,
    new_value text,
    reason text,
    performed_by character varying(128) NOT NULL,
    performed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ip_address character varying(64),
    user_agent text,
    approval_id character varying(32)
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: backup_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_records (
    id character varying(64) NOT NULL,
    backup_name character varying(255) NOT NULL,
    backup_type character varying(32) NOT NULL,
    file_path text NOT NULL,
    file_size_bytes bigint DEFAULT 0 NOT NULL,
    checksum_sha256 character varying(64),
    status character varying(32) DEFAULT 'COMPLETED'::character varying NOT NULL,
    entity_counts_json text,
    created_by character varying(128) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    verified_at timestamp without time zone,
    restored_at timestamp without time zone,
    notes text
);


--
-- Name: backup_schedules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backup_schedules (
    id character varying(32) NOT NULL,
    schedule_type character varying(32) NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    day_of_week integer DEFAULT 7,
    day_of_month integer DEFAULT 1,
    execution_time character varying(16) DEFAULT '02:00'::character varying,
    retention_count integer DEFAULT 4 NOT NULL,
    destination character varying(128) DEFAULT 'LOCAL_SNAPSHOT_STORE'::character varying,
    last_run_at timestamp without time zone,
    next_run_at timestamp without time zone,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(128) DEFAULT 'SYSTEM'::character varying
);


--
-- Name: cash_bank_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cash_bank_accounts (
    id character varying(32) NOT NULL,
    account_name character varying(128) NOT NULL,
    account_type character varying(32) NOT NULL,
    account_number character varying(64),
    bank_name character varying(128),
    ifsc character varying(32),
    branch character varying(128),
    balance numeric(15,2) DEFAULT 0.00 NOT NULL,
    status character varying(32) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: company_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_settings (
    id integer DEFAULT 1 NOT NULL,
    company_name character varying(128) DEFAULT 'TransFlow Logistics Pvt Ltd'::character varying NOT NULL,
    gstin character varying(32) DEFAULT '33AABCT1332L1Z8'::character varying,
    address text DEFAULT '124, Madurai Highway, Ramanathapuram, Tamil Nadu 623501'::text,
    phone character varying(32) DEFAULT '+91 98421 88001'::character varying,
    email character varying(128) DEFAULT 'contact@transflow.in'::character varying,
    default_bank_account_id character varying(32) DEFAULT 'ACC-002'::character varying,
    invoice_prefix character varying(16) DEFAULT 'INV-'::character varying,
    trip_prefix character varying(16) DEFAULT 'TRP-'::character varying,
    credit_period_days integer DEFAULT 30,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: configured_rates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configured_rates (
    id character varying(32) NOT NULL,
    rate_type character varying(32) NOT NULL,
    customer_id character varying(32),
    source_id character varying(32),
    material character varying(128) NOT NULL,
    loading_location character varying(128) NOT NULL,
    delivery_location character varying(128) NOT NULL,
    rate numeric(12,2) NOT NULL,
    unit character varying(32) DEFAULT 'Ton'::character varying NOT NULL,
    effective_from date NOT NULL,
    status character varying(32) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: contra_transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contra_transfers (
    id character varying(32) NOT NULL,
    transfer_date date NOT NULL,
    from_account_id character varying(32) NOT NULL,
    to_account_id character varying(32) NOT NULL,
    amount numeric(15,2) NOT NULL,
    reference_number character varying(64),
    reason text,
    performed_by character varying(128) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: correction_request_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.correction_request_items (
    id bigint NOT NULL,
    request_id character varying(32) NOT NULL,
    field_name character varying(64) NOT NULL,
    old_value text,
    requested_value text NOT NULL
);


--
-- Name: correction_request_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.correction_request_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: correction_request_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.correction_request_items_id_seq OWNED BY public.correction_request_items.id;


--
-- Name: correction_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.correction_requests (
    id character varying(32) NOT NULL,
    entity_type character varying(32) NOT NULL,
    entity_id character varying(32) NOT NULL,
    entity_identifier character varying(128) NOT NULL,
    reason text NOT NULL,
    status character varying(32) DEFAULT 'PENDING'::character varying NOT NULL,
    requested_by character varying(128) NOT NULL,
    requested_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reviewed_by character varying(128),
    reviewed_at timestamp without time zone,
    review_comment text,
    version bigint DEFAULT 0 NOT NULL
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id character varying(32) NOT NULL,
    name character varying(128) NOT NULL,
    phone character varying(32) NOT NULL,
    alternate_phone character varying(32),
    address text,
    gstin character varying(32),
    credit_terms character varying(64),
    status character varying(32) DEFAULT 'ACTIVE'::character varying NOT NULL,
    notes text,
    opening_balance numeric(15,2) DEFAULT 0.00 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: diesel_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diesel_logs (
    id character varying(32) NOT NULL,
    date date NOT NULL,
    vehicle_registration character varying(32) NOT NULL,
    driver_id character varying(32) NOT NULL,
    driver_name character varying(128) NOT NULL,
    fuel_station_id character varying(32) NOT NULL,
    fuel_station_name character varying(128) NOT NULL,
    bill_number character varying(64),
    litres numeric(10,2) NOT NULL,
    rate_per_litre numeric(10,2) NOT NULL,
    total_amount numeric(15,2) NOT NULL,
    start_km numeric(12,2),
    end_km numeric(12,2),
    km_run numeric(12,2),
    mileage numeric(8,2),
    payment_mode character varying(32) DEFAULT 'CREDIT'::character varying NOT NULL,
    status character varying(32) DEFAULT 'RECORDED'::character varying NOT NULL,
    notes text,
    entered_by character varying(128) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: drivers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.drivers (
    id character varying(32) NOT NULL,
    name character varying(128) NOT NULL,
    phone character varying(32) NOT NULL,
    license_number character varying(64),
    assigned_vehicle character varying(32),
    status character varying(32) DEFAULT 'AVAILABLE'::character varying NOT NULL,
    advance_balance numeric(15,2) DEFAULT 0.00 NOT NULL,
    total_earnings numeric(15,2) DEFAULT 0.00 NOT NULL,
    total_settled numeric(15,2) DEFAULT 0.00 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: financial_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.financial_transactions (
    id character varying(32) NOT NULL,
    date date NOT NULL,
    entity_type character varying(32) NOT NULL,
    entity_id character varying(32) NOT NULL,
    entity_name character varying(128) NOT NULL,
    transaction_type character varying(64) NOT NULL,
    category character varying(64) NOT NULL,
    debit numeric(15,2) DEFAULT 0.00 NOT NULL,
    credit numeric(15,2) DEFAULT 0.00 NOT NULL,
    balance numeric(15,2) DEFAULT 0.00 NOT NULL,
    payment_mode character varying(32),
    reference_id character varying(64),
    description text NOT NULL,
    created_by character varying(128) NOT NULL,
    status character varying(32) DEFAULT 'POSTED'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: flyway_schema_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.flyway_schema_history (
    installed_rank integer NOT NULL,
    version character varying(50),
    description character varying(200) NOT NULL,
    type character varying(20) NOT NULL,
    script character varying(1000) NOT NULL,
    checksum integer,
    installed_by character varying(100) NOT NULL,
    installed_on timestamp without time zone DEFAULT now() NOT NULL,
    execution_time integer NOT NULL,
    success boolean NOT NULL
);


--
-- Name: fuel_stations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fuel_stations (
    id character varying(32) NOT NULL,
    name character varying(128) NOT NULL,
    location character varying(128) NOT NULL,
    contact_person character varying(128),
    phone character varying(32),
    balance numeric(15,2) DEFAULT 0.00 NOT NULL,
    status character varying(32) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: invoice_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoice_items (
    id bigint NOT NULL,
    invoice_id character varying(32) NOT NULL,
    trip_id character varying(64),
    trip_date date NOT NULL,
    vehicle character varying(32) NOT NULL,
    material character varying(128) NOT NULL,
    quantity numeric(12,2) NOT NULL,
    unit character varying(32) DEFAULT 'Ton'::character varying NOT NULL,
    rate numeric(12,2) NOT NULL,
    amount numeric(15,2) NOT NULL
);


--
-- Name: invoice_items_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoice_items_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoice_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoice_items_id_seq OWNED BY public.invoice_items.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id character varying(32) NOT NULL,
    date date NOT NULL,
    due_date date,
    customer_id character varying(32) NOT NULL,
    customer_name character varying(128) NOT NULL,
    customer_gstin character varying(32),
    subtotal numeric(15,2) DEFAULT 0.00 NOT NULL,
    tax_rate numeric(5,2) DEFAULT 0.00 NOT NULL,
    tax_amount numeric(15,2) DEFAULT 0.00 NOT NULL,
    total_amount numeric(15,2) DEFAULT 0.00 NOT NULL,
    paid_amount numeric(15,2) DEFAULT 0.00 NOT NULL,
    balance_amount numeric(15,2) DEFAULT 0.00 NOT NULL,
    status character varying(32) DEFAULT 'GENERATED'::character varying NOT NULL,
    notes text,
    generated_by character varying(128) NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: locations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.locations (
    id character varying(32) NOT NULL,
    name character varying(128) NOT NULL,
    type character varying(32) NOT NULL,
    address text,
    distance_km numeric(10,2),
    status character varying(32) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: materials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.materials (
    id character varying(32) NOT NULL,
    name character varying(128) NOT NULL,
    category character varying(64) NOT NULL,
    standard_unit character varying(32) DEFAULT 'Ton'::character varying NOT NULL,
    status character varying(32) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: payment_allocations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_allocations (
    id bigint NOT NULL,
    payment_id character varying(32) NOT NULL,
    invoice_id character varying(32) NOT NULL,
    allocated_amount numeric(15,2) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: payment_allocations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.payment_allocations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: payment_allocations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.payment_allocations_id_seq OWNED BY public.payment_allocations.id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payments (
    id character varying(32) NOT NULL,
    date date NOT NULL,
    customer_id character varying(32) NOT NULL,
    customer_name character varying(128) NOT NULL,
    amount numeric(15,2) NOT NULL,
    payment_mode character varying(32) NOT NULL,
    reference_number character varying(64),
    account_id character varying(32) NOT NULL,
    status character varying(32) DEFAULT 'POSTED'::character varying NOT NULL,
    notes text,
    received_by character varying(128) NOT NULL,
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id character varying(64) NOT NULL,
    name character varying(128) NOT NULL,
    module character varying(64) NOT NULL,
    description text
);


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id character varying(32) NOT NULL,
    permission_id character varying(64) NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id character varying(32) NOT NULL,
    name character varying(64) NOT NULL,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: sources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sources (
    id character varying(32) NOT NULL,
    name character varying(128) NOT NULL,
    location character varying(128) NOT NULL,
    contact_person character varying(128),
    phone character varying(32),
    material character varying(64) NOT NULL,
    price_per_ton numeric(12,2) DEFAULT 0.00 NOT NULL,
    effective_from date NOT NULL,
    status character varying(32) DEFAULT 'ACTIVE'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: system_control; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_control (
    id integer DEFAULT 1 NOT NULL,
    system_state character varying(32) DEFAULT 'ONLINE'::character varying NOT NULL,
    maintenance_title character varying(255) DEFAULT 'System Maintenance'::character varying,
    maintenance_message text DEFAULT 'The system is currently undergoing scheduled maintenance. Please check back shortly.'::text,
    expected_recovery_time timestamp without time zone,
    shutdown_reason text,
    shutdown_by character varying(128),
    shutdown_at timestamp without time zone,
    allow_admin_bypass boolean DEFAULT true,
    allow_worker_trips boolean DEFAULT true,
    allow_accounts_payments boolean DEFAULT true,
    lock_sensitive_ops boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_by character varying(128) DEFAULT 'SYSTEM'::character varying
);


--
-- Name: system_feature_flags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_feature_flags (
    flag_key character varying(64) NOT NULL,
    name character varying(128) NOT NULL,
    description text,
    category character varying(64) DEFAULT 'OPERATIONS'::character varying,
    enabled boolean DEFAULT true NOT NULL,
    updated_by character varying(128) DEFAULT 'SYSTEM'::character varying,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: trip_status_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trip_status_history (
    id bigint NOT NULL,
    trip_id character varying(32) NOT NULL,
    old_status character varying(32),
    new_status character varying(32) NOT NULL,
    changed_by character varying(128) NOT NULL,
    comment text,
    changed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: trip_status_history_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.trip_status_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: trip_status_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.trip_status_history_id_seq OWNED BY public.trip_status_history.id;


--
-- Name: trips; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trips (
    id character varying(32) NOT NULL,
    date date NOT NULL,
    customer_id character varying(32) NOT NULL,
    customer_name character varying(128) NOT NULL,
    customer_phone character varying(32) NOT NULL,
    vehicle_registration character varying(32) NOT NULL,
    vehicle_ownership character varying(32) DEFAULT 'OWN'::character varying NOT NULL,
    driver_id character varying(32) NOT NULL,
    driver_name character varying(128) NOT NULL,
    driver_phone character varying(32) NOT NULL,
    material character varying(128) NOT NULL,
    quantity numeric(12,2) NOT NULL,
    unit character varying(32) DEFAULT 'Ton'::character varying NOT NULL,
    source character varying(128) NOT NULL,
    source_bill_no character varying(64),
    loading_location character varying(128) NOT NULL,
    delivery_location character varying(128) NOT NULL,
    loading_date_time timestamp without time zone,
    departure_date_time timestamp without time zone,
    delivery_date_time timestamp without time zone,
    unload_quantity numeric(12,2),
    unload_unit character varying(32),
    shortage numeric(12,2) DEFAULT 0.00,
    opening_km numeric(12,2),
    closing_km numeric(12,2),
    trip_km numeric(12,2),
    applied_rate numeric(12,2) DEFAULT 0.00 NOT NULL,
    rate_unit character varying(32) DEFAULT 'Ton'::character varying NOT NULL,
    total_amount numeric(15,2) DEFAULT 0.00 NOT NULL,
    status character varying(32) DEFAULT 'DELIVERED'::character varying NOT NULL,
    progress integer DEFAULT 7 NOT NULL,
    is_no_load boolean DEFAULT false NOT NULL,
    no_load_reason character varying(255),
    entered_by character varying(128) NOT NULL,
    notes text,
    delivery_proof text,
    invoice_id character varying(32),
    version bigint DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    billing_rate numeric(12,2) DEFAULT 0.00,
    transport_rate numeric(12,2) DEFAULT 0.00,
    purchase_rate numeric(12,2) DEFAULT 0.00,
    per_km_rate numeric(12,2) DEFAULT 0.00
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying(32) NOT NULL,
    username character varying(64) NOT NULL,
    password_hash character varying(255) NOT NULL,
    full_name character varying(128) NOT NULL,
    email character varying(128),
    phone character varying(32),
    role_id character varying(32) NOT NULL,
    status character varying(32) DEFAULT 'ACTIVE'::character varying NOT NULL,
    last_login_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: vehicle_expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicle_expenses (
    id character varying(32) NOT NULL,
    date date NOT NULL,
    vehicle_registration character varying(32) NOT NULL,
    expense_type character varying(64) NOT NULL,
    amount numeric(15,2) NOT NULL,
    vendor_name character varying(128),
    invoice_bill_no character varying(64),
    payment_mode character varying(32) DEFAULT 'CASH'::character varying NOT NULL,
    status character varying(32) DEFAULT 'PAID'::character varying NOT NULL,
    description text,
    entered_by character varying(128) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: vehicles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.vehicles (
    registration character varying(32) NOT NULL,
    type character varying(64) NOT NULL,
    ownership character varying(32) DEFAULT 'OWN'::character varying NOT NULL,
    capacity character varying(32) NOT NULL,
    fuel_capacity character varying(32) NOT NULL,
    current_km numeric(12,2) DEFAULT 0.00 NOT NULL,
    last_maintenance_date date,
    maintenance_fee numeric(12,2),
    insurance_expiry date,
    fc_expiry date,
    permit_expiry date,
    assigned_driver_id character varying(32),
    assigned_driver_name character varying(128),
    status character varying(32) DEFAULT 'AVAILABLE'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: wage_advances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.wage_advances (
    id character varying(32) NOT NULL,
    date date NOT NULL,
    recipient_type character varying(16) NOT NULL,
    recipient_id character varying(32) NOT NULL,
    recipient_name character varying(128) NOT NULL,
    amount numeric(15,2) NOT NULL,
    reason text,
    payment_mode character varying(32) DEFAULT 'CASH'::character varying NOT NULL,
    status character varying(32) DEFAULT 'PAID'::character varying NOT NULL,
    approved_by character varying(128),
    given_by character varying(128) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: worker_wages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.worker_wages (
    id character varying(32) NOT NULL,
    worker_id character varying(32) NOT NULL,
    worker_name character varying(128) NOT NULL,
    month_year character varying(10) NOT NULL,
    base_salary numeric(12,2) DEFAULT 0.00 NOT NULL,
    overtime_amount numeric(12,2) DEFAULT 0.00 NOT NULL,
    trip_allowance numeric(12,2) DEFAULT 0.00 NOT NULL,
    advances_deducted numeric(12,2) DEFAULT 0.00 NOT NULL,
    other_deductions numeric(12,2) DEFAULT 0.00 NOT NULL,
    net_payable numeric(12,2) DEFAULT 0.00 NOT NULL,
    status character varying(32) DEFAULT 'PENDING'::character varying NOT NULL,
    payment_date date,
    payment_mode character varying(32),
    reference_no character varying(64),
    disbursed_by character varying(128),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: workers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.workers (
    id character varying(32) NOT NULL,
    name character varying(128) NOT NULL,
    phone character varying(32) NOT NULL,
    email character varying(128),
    role character varying(64) NOT NULL,
    system_role character varying(32) NOT NULL,
    salary numeric(12,2) DEFAULT 0.00 NOT NULL,
    paid numeric(12,2) DEFAULT 0.00 NOT NULL,
    advance numeric(12,2) DEFAULT 0.00 NOT NULL,
    deduction numeric(12,2) DEFAULT 0.00 NOT NULL,
    assigned_location character varying(128),
    status character varying(32) DEFAULT 'ACTIVE'::character varying NOT NULL,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: correction_request_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.correction_request_items ALTER COLUMN id SET DEFAULT nextval('public.correction_request_items_id_seq'::regclass);


--
-- Name: invoice_items id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items ALTER COLUMN id SET DEFAULT nextval('public.invoice_items_id_seq'::regclass);


--
-- Name: payment_allocations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_allocations ALTER COLUMN id SET DEFAULT nextval('public.payment_allocations_id_seq'::regclass);


--
-- Name: trip_status_history id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_status_history ALTER COLUMN id SET DEFAULT nextval('public.trip_status_history_id_seq'::regclass);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.audit_logs VALUES (1, 'TRIP', 'TRP-11132', 'UPDATE', 'quantity', '18.50', '19.5', 'Customer weight slip revised after unloading: 19.5 Ton instead of 18.5 Ton', 'M. Ramanathan (MD)', '2026-09-22 15:52:37.827273', NULL, NULL, 'CRQ-0432');
INSERT INTO public.audit_logs VALUES (2, 'TRIP', 'TRP-17028', 'UPDATE', 'quantity', '18.50', '19.5', 'Customer weight slip revised after unloading: 19.5 Ton instead of 18.5 Ton', 'M. Ramanathan (MD)', '2026-09-22 20:27:29.528616', NULL, NULL, 'CRQ-0528');
INSERT INTO public.audit_logs VALUES (3, 'TRIP', 'TRP-15923', 'UPDATE', 'quantity', '18.50', '19.5', 'Customer weight slip revised after unloading: 19.5 Ton instead of 18.5 Ton', 'M. Ramanathan (MD)', '2026-09-23 19:53:57.85834', NULL, NULL, 'CRQ-0423');
INSERT INTO public.audit_logs VALUES (4, 'TRIP', 'TRP-15924', 'UPDATE', 'quantity', '18.50', '19.5', 'Customer weight slip revised after unloading: 19.5 Ton instead of 18.5 Ton', 'M. Ramanathan (MD)', '2026-09-23 20:37:38.729949', NULL, NULL, 'CRQ-0424');
INSERT INTO public.audit_logs VALUES (5, 'TRIP', 'TRP-15927', 'UPDATE', 'quantity', '18.50', '19.5', 'Customer weight slip revised after unloading: 19.5 Ton instead of 18.5 Ton', 'M. Ramanathan (MD)', '2026-09-23 20:44:35.514674', NULL, NULL, 'CRQ-0425');


--
-- Data for Name: backup_records; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: backup_schedules; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.backup_schedules VALUES ('WEEKLY', 'WEEKLY', true, 7, 1, '02:00', 4, 'LOCAL_SNAPSHOT_STORE', NULL, NULL, '2026-09-28 19:55:29.09898', 'SYSTEM');
INSERT INTO public.backup_schedules VALUES ('MONTHLY', 'MONTHLY', true, 7, 1, '03:00', 12, 'LOCAL_SNAPSHOT_STORE', NULL, NULL, '2026-09-28 19:55:29.09898', 'SYSTEM');


--
-- Data for Name: cash_bank_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.cash_bank_accounts VALUES ('ACC-001', 'Office Cash in Hand', 'CASH', NULL, NULL, NULL, 'Head Office Safe', 85400.00, 'ACTIVE', '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');
INSERT INTO public.cash_bank_accounts VALUES ('ACC-003', 'SBI Operating A/c', 'BANK', '38901234567', 'State Bank of India', 'SBIN0000910', 'Ramnad Collectorate Branch', 210000.00, 'ACTIVE', '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');
INSERT INTO public.cash_bank_accounts VALUES ('ACC-002', 'HDFC Corporate Current A/c', 'BANK', '50200088991122', 'HDFC Bank', 'HDFC0001420', 'Ramanathapuram Main Branch', 724852.50, 'ACTIVE', '2026-09-22 15:45:06.269432', '2026-09-23 20:44:35.569422');


--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.company_settings VALUES (1, 'SRI AMMAN ARUL TRANSPORTS', '33AABCT1332L1Z8', '124, Madurai Highway, Ramanathapuram, Tamil Nadu 623501', '+91 98421 88001', 'contact@sriammanarul.in', 'ACC-002', 'INV-', 'TRP-', 30, '2026-09-22 15:45:06.269432');


--
-- Data for Name: configured_rates; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.configured_rates VALUES ('RAT-001', 'CUSTOMER', 'CUS-00124', NULL, '20 MM Aggregate', 'Sri Ramanatha Blue Metals Crusher', 'Paramakudi Highway Site KM 42', 780.00, 'Ton', '2026-01-01', 'ACTIVE', '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');
INSERT INTO public.configured_rates VALUES ('RAT-002', 'CUSTOMER', 'CUS-00124', NULL, 'Black M-Sand', 'Ayyappan Quarry & Crushers', 'Paramakudi Highway Site KM 42', 820.00, 'Ton', '2026-01-01', 'ACTIVE', '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');
INSERT INTO public.configured_rates VALUES ('RAT-003', 'CUSTOMER', 'CUS-00125', NULL, 'Boulders (Sea Wall / Base)', 'Valinokkam Boulders Depot', 'Rameswaram Port Coastal Yard', 650.00, 'Ton', '2026-01-01', 'ACTIVE', '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');
INSERT INTO public.configured_rates VALUES ('RAT-306', 'CUSTOMER', 'CUS-00124', NULL, 'Black M-Sand', 'ABC Crusher Yard', 'K Engineering Site', 1150.00, 'Ton', '2026-10-01', 'ACTIVE', '2026-09-25 17:24:12.303291', '2026-09-25 17:24:12.303291');
INSERT INTO public.configured_rates VALUES ('RAT-215', 'CUSTOMER', 'CUS-00124', NULL, 'Black M-Sand', 'ABC Crusher Yard', 'K Engineering Site', 1150.00, 'Ton', '2026-10-01', 'ACTIVE', '2026-09-25 19:17:36.654828', '2026-09-25 19:17:36.654828');
INSERT INTO public.configured_rates VALUES ('RAT-522', 'CUSTOMER', 'CUS-00124', NULL, 'Black M-Sand', 'ABC Crusher Yard', 'K Engineering Site', 1150.00, 'Ton', '2026-10-01', 'ACTIVE', '2026-09-25 20:02:31.955708', '2026-09-25 20:02:31.955708');


--
-- Data for Name: contra_transfers; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: correction_request_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.correction_request_items VALUES (1, 'CRQ-0432', 'quantity', '18.50', '19.5');
INSERT INTO public.correction_request_items VALUES (2, 'CRQ-0528', 'quantity', '18.50', '19.5');
INSERT INTO public.correction_request_items VALUES (3, 'CRQ-0423', 'quantity', '18.50', '19.5');
INSERT INTO public.correction_request_items VALUES (4, 'CRQ-0424', 'quantity', '18.50', '19.5');
INSERT INTO public.correction_request_items VALUES (5, 'CRQ-0425', 'quantity', '18.50', '19.5');


--
-- Data for Name: correction_requests; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.correction_requests VALUES ('CRQ-0432', 'TRIP', 'TRP-11132', 'Trip #TRP-11132 (K Engineering Infra Projects)', 'Customer weight slip revised after unloading: 19.5 Ton instead of 18.5 Ton', 'APPROVED', 'Arun Kumar (Dispatcher)', '2026-09-22 15:52:37.752273', 'M. Ramanathan (MD)', '2026-09-22 15:52:37.835284', 'Verified with Paramakudi weighbridge slip - Approved', 1);
INSERT INTO public.correction_requests VALUES ('CRQ-0528', 'TRIP', 'TRP-17028', 'Trip #TRP-17028 (K Engineering Infra Projects)', 'Customer weight slip revised after unloading: 19.5 Ton instead of 18.5 Ton', 'APPROVED', 'Arun Kumar (Dispatcher)', '2026-09-22 20:27:29.433412', 'M. Ramanathan (MD)', '2026-09-22 20:27:29.533615', 'Verified with Paramakudi weighbridge slip - Approved', 1);
INSERT INTO public.correction_requests VALUES ('CRQ-0423', 'TRIP', 'TRP-15923', 'Trip #TRP-15923 (K Engineering Infra Projects)', 'Customer weight slip revised after unloading: 19.5 Ton instead of 18.5 Ton', 'APPROVED', 'Arun Kumar (Dispatcher)', '2026-09-23 19:53:57.792795', 'M. Ramanathan (MD)', '2026-09-23 19:53:57.861336', 'Verified with Paramakudi weighbridge slip - Approved', 1);
INSERT INTO public.correction_requests VALUES ('CRQ-0424', 'TRIP', 'TRP-15924', 'Trip #TRP-15924 (K Engineering Infra Projects)', 'Customer weight slip revised after unloading: 19.5 Ton instead of 18.5 Ton', 'APPROVED', 'Arun Kumar (Dispatcher)', '2026-09-23 20:37:38.683108', 'M. Ramanathan (MD)', '2026-09-23 20:37:38.734552', 'Verified with Paramakudi weighbridge slip - Approved', 1);
INSERT INTO public.correction_requests VALUES ('CRQ-0425', 'TRIP', 'TRP-15927', 'Trip #TRP-15927 (K Engineering Infra Projects)', 'Customer weight slip revised after unloading: 19.5 Ton instead of 18.5 Ton', 'APPROVED', 'Arun Kumar (Dispatcher)', '2026-09-23 20:44:35.488602', 'M. Ramanathan (MD)', '2026-09-23 20:44:35.515678', 'Verified with Paramakudi weighbridge slip - Approved', 1);


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.customers VALUES ('CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', '+91 98421 11223', 'National Highway 49, Paramakudi, Ramanathapuram Dist.', '33AABCK1234F1Z5', '30 Days', 'ACTIVE', NULL, 1355000.00, '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');
INSERT INTO public.customers VALUES ('CUS-00125', 'DBL Highway Construction Ltd', '+91 98421 88442', '+91 98421 88443', 'Bypass Ring Road Project Office, Ramanathapuram', '33AABCD9876E1Z2', '15 Days', 'ACTIVE', NULL, 450000.00, '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');
INSERT INTO public.customers VALUES ('CUS-00126', 'Rajaganapathy Builders', '+91 97882 33441', NULL, 'East Coast Road, Rameswaram Branch', '33AABCR5544G1Z9', '7 Days', 'ACTIVE', NULL, 120000.00, '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');
INSERT INTO public.customers VALUES ('CUS-01254', 'Test Customer', '9842100000', NULL, 'Madurai', NULL, NULL, 'ACTIVE', NULL, 0.00, '2026-09-25 19:17:52.855617', '2026-09-25 19:17:52.855617');


--
-- Data for Name: diesel_logs; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: drivers; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.drivers VALUES ('DRV-0012', 'M. Murugan', '+91 98421 66101', 'TN-65-2018-004412', 'TN 58 AB 2345', 'AVAILABLE', 2500.00, 0.00, 0.00, '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');
INSERT INTO public.drivers VALUES ('DRV-0013', 'K. Rajendran', '+91 97882 11045', 'TN-58-2016-009821', 'TN 65 CD 8821', 'AVAILABLE', 1200.00, 0.00, 0.00, '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');
INSERT INTO public.drivers VALUES ('DRV-0014', 'P. Ganesan', '+91 94431 88720', 'TN-67-2020-001289', 'TN 58 EF 4410', 'AVAILABLE', 0.00, 0.00, 0.00, '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');


--
-- Data for Name: financial_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.financial_transactions VALUES ('TXN-51132', '2026-09-18', 'CUSTOMER', 'CUS-00124', 'K Engineering Infra Projects', 'RECEIVABLE', 'Revenue', 0.00, 15970.50, 15970.50, NULL, 'INV-0432', 'Invoice INV-0432 generated with 1 trips', 'K. Venkat (Senior Accountant)', 'POSTED', '2026-09-22 15:52:37.919973');
INSERT INTO public.financial_transactions VALUES ('TXN-51133', '2026-09-18', 'CUSTOMER', 'CUS-00124', 'K Engineering Infra Projects', 'CUSTOMER_PAYMENT', 'Receipt', 15970.50, 0.00, 0.00, 'NEFT', 'PAY-0432', 'Payment received via NEFT (Ref: HDFCN26091800921)', 'K. Venkat (Senior Accountant)', 'POSTED', '2026-09-22 15:52:37.993593');
INSERT INTO public.financial_transactions VALUES ('TXN-57028', '2026-09-18', 'CUSTOMER', 'CUS-00124', 'K Engineering Infra Projects', 'RECEIVABLE', 'Revenue', 0.00, 15970.50, 15970.50, NULL, 'INV-0528', 'Invoice INV-0528 generated with 1 trips', 'K. Venkat (Senior Accountant)', 'POSTED', '2026-09-22 20:27:29.638316');
INSERT INTO public.financial_transactions VALUES ('TXN-57029', '2026-09-18', 'CUSTOMER', 'CUS-00124', 'K Engineering Infra Projects', 'CUSTOMER_PAYMENT', 'Receipt', 15970.50, 0.00, 0.00, 'NEFT', 'PAY-0528', 'Payment received via NEFT (Ref: HDFCN26091800921)', 'K. Venkat (Senior Accountant)', 'POSTED', '2026-09-22 20:27:29.706493');
INSERT INTO public.financial_transactions VALUES ('TXN-55923', '2026-09-18', 'CUSTOMER', 'CUS-00124', 'K Engineering Infra Projects', 'RECEIVABLE', 'Revenue', 0.00, 15970.50, 15970.50, NULL, 'INV-0423', 'Invoice INV-0423 generated with 1 trips', 'K. Venkat (Senior Accountant)', 'POSTED', '2026-09-23 19:53:57.928082');
INSERT INTO public.financial_transactions VALUES ('TXN-55924', '2026-09-18', 'CUSTOMER', 'CUS-00124', 'K Engineering Infra Projects', 'CUSTOMER_PAYMENT', 'Receipt', 15970.50, 0.00, 0.00, 'NEFT', 'PAY-0423', 'Payment received via NEFT (Ref: HDFCN26091800921)', 'K. Venkat (Senior Accountant)', 'POSTED', '2026-09-23 19:53:57.982366');
INSERT INTO public.financial_transactions VALUES ('TXN-55925', '2026-09-18', 'CUSTOMER', 'CUS-00124', 'K Engineering Infra Projects', 'RECEIVABLE', 'Revenue', 0.00, 15970.50, 15970.50, NULL, 'INV-0424', 'Invoice INV-0424 generated with 1 trips', 'K. Venkat (Senior Accountant)', 'POSTED', '2026-09-23 20:37:38.788263');
INSERT INTO public.financial_transactions VALUES ('TXN-55926', '2026-09-18', 'CUSTOMER', 'CUS-00124', 'K Engineering Infra Projects', 'CUSTOMER_PAYMENT', 'Receipt', 15970.50, 0.00, 0.00, 'NEFT', 'PAY-0424', 'Payment received via NEFT (Ref: HDFCN26091800921)', 'K. Venkat (Senior Accountant)', 'POSTED', '2026-09-23 20:37:38.829541');
INSERT INTO public.financial_transactions VALUES ('TXN-55927', '2026-09-18', 'CUSTOMER', 'CUS-00124', 'K Engineering Infra Projects', 'RECEIVABLE', 'Revenue', 0.00, 15970.50, 15970.50, NULL, 'INV-0425', 'Invoice INV-0425 generated with 1 trips', 'K. Venkat (Senior Accountant)', 'POSTED', '2026-09-23 20:44:35.54688');
INSERT INTO public.financial_transactions VALUES ('TXN-55928', '2026-09-18', 'CUSTOMER', 'CUS-00124', 'K Engineering Infra Projects', 'CUSTOMER_PAYMENT', 'Receipt', 15970.50, 0.00, 0.00, 'NEFT', 'PAY-0425', 'Payment received via NEFT (Ref: HDFCN26091800921)', 'K. Venkat (Senior Accountant)', 'POSTED', '2026-09-23 20:44:35.568402');


--
-- Data for Name: flyway_schema_history; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.flyway_schema_history VALUES (1, '1', 'create security and rbac', 'SQL', 'V1__create_security_and_rbac.sql', -1606886653, 'postgres', '2026-09-22 15:45:05.698508', 73, true);
INSERT INTO public.flyway_schema_history VALUES (2, '2', 'create masters', 'SQL', 'V2__create_masters.sql', 799594315, 'postgres', '2026-09-22 15:45:05.823661', 72, true);
INSERT INTO public.flyway_schema_history VALUES (3, '3', 'create rate cards', 'SQL', 'V3__create_rate_cards.sql', -939790838, 'postgres', '2026-09-22 15:45:05.920359', 14, true);
INSERT INTO public.flyway_schema_history VALUES (4, '4', 'create trips', 'SQL', 'V4__create_trips.sql', 773187025, 'postgres', '2026-09-22 15:45:05.946334', 40, true);
INSERT INTO public.flyway_schema_history VALUES (5, '5', 'create invoices', 'SQL', 'V5__create_invoices.sql', 869926091, 'postgres', '2026-09-22 15:45:06.000023', 33, true);
INSERT INTO public.flyway_schema_history VALUES (6, '6', 'create payments and accounts', 'SQL', 'V6__create_payments_and_accounts.sql', 948816473, 'postgres', '2026-09-22 15:45:06.043847', 42, true);
INSERT INTO public.flyway_schema_history VALUES (7, '7', 'create ledgers', 'SQL', 'V7__create_ledgers.sql', -164312126, 'postgres', '2026-09-22 15:45:06.096014', 16, true);
INSERT INTO public.flyway_schema_history VALUES (8, '8', 'create diesel and maintenance', 'SQL', 'V8__create_diesel_and_maintenance.sql', -799058144, 'postgres', '2026-09-22 15:45:06.120879', 26, true);
INSERT INTO public.flyway_schema_history VALUES (9, '9', 'create wages', 'SQL', 'V9__create_wages.sql', -294436529, 'postgres', '2026-09-22 15:45:06.157822', 20, true);
INSERT INTO public.flyway_schema_history VALUES (10, '10', 'create corrections and approvals', 'SQL', 'V10__create_corrections_and_approvals.sql', -113625428, 'postgres', '2026-09-22 15:45:06.186183', 27, true);
INSERT INTO public.flyway_schema_history VALUES (11, '11', 'create audit logs', 'SQL', 'V11__create_audit_logs.sql', 539924088, 'postgres', '2026-09-22 15:45:06.221369', 24, true);
INSERT INTO public.flyway_schema_history VALUES (12, '12', 'insert initial seed data', 'SQL', 'V12__insert_initial_seed_data.sql', 1775468371, 'postgres', '2026-09-22 15:45:06.254754', 65, true);
INSERT INTO public.flyway_schema_history VALUES (13, '13', 'allow direct invoice items', 'SQL', 'V13__allow_direct_invoice_items.sql', 643833101, 'postgres', '2026-09-22 15:45:06.338109', 7, true);
INSERT INTO public.flyway_schema_history VALUES (14, '14', 'relax customer address', 'SQL', 'V14__relax_customer_address.sql', -1279981364, 'postgres', '2026-09-22 15:45:06.354243', 2, true);
INSERT INTO public.flyway_schema_history VALUES (15, '15', 'update branding', 'SQL', 'V15__update_branding.sql', -692130042, 'postgres', '2026-09-25 11:27:50.843355', 23, true);
INSERT INTO public.flyway_schema_history VALUES (16, '16', 'add trip rates', 'SQL', 'V16__add_trip_rates.sql', -718436571, 'postgres', '2026-09-25 13:37:12.225054', 100, true);
INSERT INTO public.flyway_schema_history VALUES (17, '17', 'create system control and backups', 'SQL', 'V17__create_system_control_and_backups.sql', 1890954816, 'postgres', '2026-09-28 19:55:29.067105', 161, true);


--
-- Data for Name: fuel_stations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.fuel_stations VALUES ('PMP-001', 'Indian Oil Corporation - Ramnad Bypass', 'NH 49, Ramanathapuram', 'P. Selvam', '+91 94431 22900', 48500.00, 'ACTIVE', '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');
INSERT INTO public.fuel_stations VALUES ('PMP-002', 'Bharat Petroleum - Paramakudi', 'Paramakudi Town', 'R. Muthu', '+91 97882 66700', 12000.00, 'ACTIVE', '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');


--
-- Data for Name: invoice_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.invoice_items VALUES (1, 'INV-0432', 'TRP-11132', '2026-09-18', 'TN 58 AB 2345', '20 MM Aggregate', 19.50, 'Ton', 780.00, 15210.00);
INSERT INTO public.invoice_items VALUES (2, 'INV-0528', 'TRP-17028', '2026-09-18', 'TN 58 AB 2345', '20 MM Aggregate', 19.50, 'Ton', 780.00, 15210.00);
INSERT INTO public.invoice_items VALUES (3, 'INV-0423', 'TRP-15923', '2026-09-18', 'TN 58 AB 2345', '20 MM Aggregate', 19.50, 'Ton', 780.00, 15210.00);
INSERT INTO public.invoice_items VALUES (4, 'INV-0424', 'TRP-15924', '2026-09-18', 'TN 58 AB 2345', '20 MM Aggregate', 19.50, 'Ton', 780.00, 15210.00);
INSERT INTO public.invoice_items VALUES (5, 'INV-0425', 'TRP-15927', '2026-09-18', 'TN 58 AB 2345', '20 MM Aggregate', 19.50, 'Ton', 780.00, 15210.00);


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.invoices VALUES ('INV-0432', '2026-09-18', '2026-10-18', 'CUS-00124', 'K Engineering Infra Projects', '33AABCK1234F1Z5', 15210.00, 5.00, 760.50, 15970.50, 15970.50, 0.00, 'PAID', 'GST Tax Invoice for NH 49 Highway delivery', 'K. Venkat (Senior Accountant)', 1, '2026-09-22 15:52:37.890958', '2026-09-22 15:52:37.994594');
INSERT INTO public.invoices VALUES ('INV-0528', '2026-09-18', '2026-10-18', 'CUS-00124', 'K Engineering Infra Projects', '33AABCK1234F1Z5', 15210.00, 5.00, 760.50, 15970.50, 15970.50, 0.00, 'PAID', 'GST Tax Invoice for NH 49 Highway delivery', 'K. Venkat (Senior Accountant)', 1, '2026-09-22 20:27:29.599525', '2026-09-22 20:27:29.707679');
INSERT INTO public.invoices VALUES ('INV-0423', '2026-09-18', '2026-10-18', 'CUS-00124', 'K Engineering Infra Projects', '33AABCK1234F1Z5', 15210.00, 5.00, 760.50, 15970.50, 15970.50, 0.00, 'PAID', 'GST Tax Invoice for NH 49 Highway delivery', 'K. Venkat (Senior Accountant)', 1, '2026-09-23 19:53:57.907749', '2026-09-23 19:53:57.983367');
INSERT INTO public.invoices VALUES ('INV-0424', '2026-09-18', '2026-10-18', 'CUS-00124', 'K Engineering Infra Projects', '33AABCK1234F1Z5', 15210.00, 5.00, 760.50, 15970.50, 15970.50, 0.00, 'PAID', 'GST Tax Invoice for NH 49 Highway delivery', 'K. Venkat (Senior Accountant)', 1, '2026-09-23 20:37:38.773284', '2026-09-23 20:37:38.830607');
INSERT INTO public.invoices VALUES ('INV-0425', '2026-09-18', '2026-10-18', 'CUS-00124', 'K Engineering Infra Projects', '33AABCK1234F1Z5', 15210.00, 5.00, 760.50, 15970.50, 15970.50, 0.00, 'PAID', 'GST Tax Invoice for NH 49 Highway delivery', 'K. Venkat (Senior Accountant)', 1, '2026-09-23 20:44:35.542349', '2026-09-23 20:44:35.569422');


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.locations VALUES ('LOC-001', 'Paramakudi Highway Site KM 42', 'Site', 'NH 49 Extension, Paramakudi', 38.50, 'ACTIVE', '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');
INSERT INTO public.locations VALUES ('LOC-002', 'Rameswaram Port Coastal Yard', 'Yard', 'Pamban Coastal Road, Rameswaram', 52.00, 'ACTIVE', '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');
INSERT INTO public.locations VALUES ('LOC-003', 'Ramnad Ring Road Bypass Phase-2', 'Site', 'Collectorate Bypass, Ramanathapuram', 14.00, 'ACTIVE', '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');


--
-- Data for Name: materials; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.materials VALUES ('MAT-001', '20 MM Aggregate', 'Coarse Aggregate', 'Ton', 'ACTIVE', '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');
INSERT INTO public.materials VALUES ('MAT-002', '12 MM Aggregate', 'Coarse Aggregate', 'Ton', 'ACTIVE', '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');
INSERT INTO public.materials VALUES ('MAT-003', 'Black M-Sand', 'Manufactured Sand', 'Ton', 'ACTIVE', '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');
INSERT INTO public.materials VALUES ('MAT-004', 'Boulders (Sea Wall / Base)', 'Raw Stone', 'Ton', 'ACTIVE', '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');
INSERT INTO public.materials VALUES ('MAT-005', 'WMM (Wet Mix Macadam)', 'Road Base', 'Ton', 'ACTIVE', '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');


--
-- Data for Name: payment_allocations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.payment_allocations VALUES (1, 'PAY-0432', 'INV-0432', 15970.50, '2026-09-22 15:52:37.975592');
INSERT INTO public.payment_allocations VALUES (2, 'PAY-0528', 'INV-0528', 15970.50, '2026-09-22 20:27:29.689452');
INSERT INTO public.payment_allocations VALUES (3, 'PAY-0423', 'INV-0423', 15970.50, '2026-09-23 19:53:57.969213');
INSERT INTO public.payment_allocations VALUES (4, 'PAY-0424', 'INV-0424', 15970.50, '2026-09-23 20:37:38.818849');
INSERT INTO public.payment_allocations VALUES (5, 'PAY-0425', 'INV-0425', 15970.50, '2026-09-23 20:44:35.563917');


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.payments VALUES ('PAY-0432', '2026-09-18', 'CUS-00124', 'K Engineering Infra Projects', 15970.50, 'NEFT', 'HDFCN26091800921', 'ACC-002', 'POSTED', 'Full settlement for invoice INV-0432', 'K. Venkat (Senior Accountant)', 0, '2026-09-22 15:52:37.96559', '2026-09-22 15:52:37.96559');
INSERT INTO public.payments VALUES ('PAY-0528', '2026-09-18', 'CUS-00124', 'K Engineering Infra Projects', 15970.50, 'NEFT', 'HDFCN26091800921', 'ACC-002', 'POSTED', 'Full settlement for invoice INV-0528', 'K. Venkat (Senior Accountant)', 0, '2026-09-22 20:27:29.680846', '2026-09-22 20:27:29.680846');
INSERT INTO public.payments VALUES ('PAY-0423', '2026-09-18', 'CUS-00124', 'K Engineering Infra Projects', 15970.50, 'NEFT', 'HDFCN26091800921', 'ACC-002', 'POSTED', 'Full settlement for invoice INV-0423', 'K. Venkat (Senior Accountant)', 0, '2026-09-23 19:53:57.964605', '2026-09-23 19:53:57.964605');
INSERT INTO public.payments VALUES ('PAY-0424', '2026-09-18', 'CUS-00124', 'K Engineering Infra Projects', 15970.50, 'NEFT', 'HDFCN26091800921', 'ACC-002', 'POSTED', 'Full settlement for invoice INV-0424', 'K. Venkat (Senior Accountant)', 0, '2026-09-23 20:37:38.814849', '2026-09-23 20:37:38.814849');
INSERT INTO public.payments VALUES ('PAY-0425', '2026-09-18', 'CUS-00124', 'K Engineering Infra Projects', 15970.50, 'NEFT', 'HDFCN26091800921', 'ACC-002', 'POSTED', 'Full settlement for invoice INV-0425', 'K. Venkat (Senior Accountant)', 0, '2026-09-23 20:44:35.562893', '2026-09-23 20:44:35.562893');


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.permissions VALUES ('TRIP_CREATE', 'Create Trips', 'OPERATIONS', 'Can log new operational trips');
INSERT INTO public.permissions VALUES ('TRIP_VIEW', 'View Trips', 'OPERATIONS', 'Can view trips list and details');
INSERT INTO public.permissions VALUES ('TRIP_EDIT_REQUEST', 'Request Trip Edit', 'OPERATIONS', 'Can submit correction requests for trips');
INSERT INTO public.permissions VALUES ('TRIP_APPROVE', 'Approve Trip Edits', 'GOVERNANCE', 'Can approve trip corrections');
INSERT INTO public.permissions VALUES ('CUSTOMER_VIEW', 'View Customers', 'MASTERS', 'Can search and view customer profiles');
INSERT INTO public.permissions VALUES ('CUSTOMER_MANAGE', 'Manage Customers', 'MASTERS', 'Can create and edit customer details');
INSERT INTO public.permissions VALUES ('VEHICLE_MANAGE', 'Manage Vehicles', 'MASTERS', 'Can manage vehicles fleet');
INSERT INTO public.permissions VALUES ('DRIVER_MANAGE', 'Manage Drivers', 'MASTERS', 'Can manage driver records');
INSERT INTO public.permissions VALUES ('RATE_MANAGE', 'Manage Rate Cards', 'MASTERS', 'Can configure customer and crusher rates');
INSERT INTO public.permissions VALUES ('INVOICE_CREATE', 'Create Invoices', 'FINANCE', 'Can generate GST invoices from trips');
INSERT INTO public.permissions VALUES ('INVOICE_VIEW', 'View Invoices', 'FINANCE', 'Can view customer invoices');
INSERT INTO public.permissions VALUES ('PAYMENT_CREATE', 'Record Payments', 'FINANCE', 'Can record customer payments and allocate');
INSERT INTO public.permissions VALUES ('PAYMENT_VIEW', 'View Payments', 'FINANCE', 'Can view payment receipts and ledgers');
INSERT INTO public.permissions VALUES ('PAYMENT_REVERSE', 'Reverse Payments', 'FINANCE', 'Can perform reversal transactions for invalid payments');
INSERT INTO public.permissions VALUES ('DIESEL_MANAGE', 'Manage Diesel', 'FINANCE', 'Can enter diesel receipts and view station balances');
INSERT INTO public.permissions VALUES ('WAGE_MANAGE', 'Manage Wages', 'FINANCE', 'Can disburse wages and record driver advances');
INSERT INTO public.permissions VALUES ('CASHBANK_MANAGE', 'Manage Cash and Bank', 'FINANCE', 'Can manage accounts and perform contra transfers');
INSERT INTO public.permissions VALUES ('AUDIT_VIEW', 'View Audit Logs', 'GOVERNANCE', 'Can inspect system audit logs');
INSERT INTO public.permissions VALUES ('USER_MANAGE', 'Manage Users', 'SECURITY', 'Can create, edit and disable users');
INSERT INTO public.permissions VALUES ('SETTINGS_MANAGE', 'Manage Settings', 'SYSTEM', 'Can configure company profile and numbering');


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.role_permissions VALUES ('ROLE_ADMIN', 'TRIP_CREATE');
INSERT INTO public.role_permissions VALUES ('ROLE_ADMIN', 'TRIP_VIEW');
INSERT INTO public.role_permissions VALUES ('ROLE_ADMIN', 'TRIP_EDIT_REQUEST');
INSERT INTO public.role_permissions VALUES ('ROLE_ADMIN', 'TRIP_APPROVE');
INSERT INTO public.role_permissions VALUES ('ROLE_ADMIN', 'CUSTOMER_VIEW');
INSERT INTO public.role_permissions VALUES ('ROLE_ADMIN', 'CUSTOMER_MANAGE');
INSERT INTO public.role_permissions VALUES ('ROLE_ADMIN', 'VEHICLE_MANAGE');
INSERT INTO public.role_permissions VALUES ('ROLE_ADMIN', 'DRIVER_MANAGE');
INSERT INTO public.role_permissions VALUES ('ROLE_ADMIN', 'RATE_MANAGE');
INSERT INTO public.role_permissions VALUES ('ROLE_ADMIN', 'INVOICE_CREATE');
INSERT INTO public.role_permissions VALUES ('ROLE_ADMIN', 'INVOICE_VIEW');
INSERT INTO public.role_permissions VALUES ('ROLE_ADMIN', 'PAYMENT_CREATE');
INSERT INTO public.role_permissions VALUES ('ROLE_ADMIN', 'PAYMENT_VIEW');
INSERT INTO public.role_permissions VALUES ('ROLE_ADMIN', 'PAYMENT_REVERSE');
INSERT INTO public.role_permissions VALUES ('ROLE_ADMIN', 'DIESEL_MANAGE');
INSERT INTO public.role_permissions VALUES ('ROLE_ADMIN', 'WAGE_MANAGE');
INSERT INTO public.role_permissions VALUES ('ROLE_ADMIN', 'CASHBANK_MANAGE');
INSERT INTO public.role_permissions VALUES ('ROLE_ADMIN', 'AUDIT_VIEW');
INSERT INTO public.role_permissions VALUES ('ROLE_ADMIN', 'USER_MANAGE');
INSERT INTO public.role_permissions VALUES ('ROLE_ADMIN', 'SETTINGS_MANAGE');
INSERT INTO public.role_permissions VALUES ('ROLE_MD', 'TRIP_VIEW');
INSERT INTO public.role_permissions VALUES ('ROLE_MD', 'TRIP_APPROVE');
INSERT INTO public.role_permissions VALUES ('ROLE_MD', 'CUSTOMER_VIEW');
INSERT INTO public.role_permissions VALUES ('ROLE_MD', 'INVOICE_VIEW');
INSERT INTO public.role_permissions VALUES ('ROLE_MD', 'PAYMENT_VIEW');
INSERT INTO public.role_permissions VALUES ('ROLE_MD', 'AUDIT_VIEW');
INSERT INTO public.role_permissions VALUES ('ROLE_MANAGER', 'TRIP_CREATE');
INSERT INTO public.role_permissions VALUES ('ROLE_MANAGER', 'TRIP_VIEW');
INSERT INTO public.role_permissions VALUES ('ROLE_MANAGER', 'TRIP_EDIT_REQUEST');
INSERT INTO public.role_permissions VALUES ('ROLE_MANAGER', 'TRIP_APPROVE');
INSERT INTO public.role_permissions VALUES ('ROLE_MANAGER', 'CUSTOMER_VIEW');
INSERT INTO public.role_permissions VALUES ('ROLE_MANAGER', 'CUSTOMER_MANAGE');
INSERT INTO public.role_permissions VALUES ('ROLE_MANAGER', 'VEHICLE_MANAGE');
INSERT INTO public.role_permissions VALUES ('ROLE_MANAGER', 'DRIVER_MANAGE');
INSERT INTO public.role_permissions VALUES ('ROLE_MANAGER', 'RATE_MANAGE');
INSERT INTO public.role_permissions VALUES ('ROLE_ACCOUNTS', 'CUSTOMER_VIEW');
INSERT INTO public.role_permissions VALUES ('ROLE_ACCOUNTS', 'INVOICE_CREATE');
INSERT INTO public.role_permissions VALUES ('ROLE_ACCOUNTS', 'INVOICE_VIEW');
INSERT INTO public.role_permissions VALUES ('ROLE_ACCOUNTS', 'PAYMENT_CREATE');
INSERT INTO public.role_permissions VALUES ('ROLE_ACCOUNTS', 'PAYMENT_VIEW');
INSERT INTO public.role_permissions VALUES ('ROLE_ACCOUNTS', 'PAYMENT_REVERSE');
INSERT INTO public.role_permissions VALUES ('ROLE_ACCOUNTS', 'DIESEL_MANAGE');
INSERT INTO public.role_permissions VALUES ('ROLE_ACCOUNTS', 'WAGE_MANAGE');
INSERT INTO public.role_permissions VALUES ('ROLE_ACCOUNTS', 'CASHBANK_MANAGE');
INSERT INTO public.role_permissions VALUES ('ROLE_WORKER', 'TRIP_CREATE');
INSERT INTO public.role_permissions VALUES ('ROLE_WORKER', 'TRIP_VIEW');
INSERT INTO public.role_permissions VALUES ('ROLE_WORKER', 'TRIP_EDIT_REQUEST');
INSERT INTO public.role_permissions VALUES ('ROLE_WORKER', 'CUSTOMER_VIEW');


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.roles VALUES ('ROLE_ADMIN', 'ADMIN', 'System Administrator with total control', '2026-09-22 15:45:06.269432');
INSERT INTO public.roles VALUES ('ROLE_MD', 'MD', 'Managing Director with executive oversight and approval rights', '2026-09-22 15:45:06.269432');
INSERT INTO public.roles VALUES ('ROLE_MANAGER', 'MANAGER', 'Operations Manager with fleet and rate management rights', '2026-09-22 15:45:06.269432');
INSERT INTO public.roles VALUES ('ROLE_ACCOUNTS', 'ACCOUNTS', 'Financial Officer with invoicing and payment management rights', '2026-09-22 15:45:06.269432');
INSERT INTO public.roles VALUES ('ROLE_WORKER', 'WORKER', 'Data Entry Operator with trip logging rights', '2026-09-22 15:45:06.269432');


--
-- Data for Name: sources; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.sources VALUES ('SRC-001', 'Sri Ramanatha Blue Metals Crusher', 'Sayalgudi Quarry Area, Ramnad', NULL, NULL, '20 MM Blue Metal', 420.00, '2026-01-01', 'ACTIVE', '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');
INSERT INTO public.sources VALUES ('SRC-002', 'Ayyappan Quarry & Crushers', 'Uchipuli Hills, Ramanathapuram', NULL, NULL, 'Black M-Sand', 480.00, '2026-01-01', 'ACTIVE', '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');
INSERT INTO public.sources VALUES ('SRC-003', 'Valinokkam Boulders Depot', 'Valinokkam Coast Area', NULL, NULL, 'Heavy Boulders', 350.00, '2026-01-01', 'ACTIVE', '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');


--
-- Data for Name: system_control; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.system_control VALUES (1, 'ONLINE', 'System Maintenance', 'The system is currently undergoing scheduled maintenance. Normal access will resume shortly.', NULL, NULL, NULL, NULL, true, true, true, false, '2026-09-28 19:55:29.09898', 'SYSTEM');


--
-- Data for Name: system_feature_flags; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.system_feature_flags VALUES ('WORKER_NEW_TRIP', 'Worker New Trip Creation', 'Allows field workers to dispatch and record new freight trips', 'OPERATIONS', true, 'SYSTEM', '2026-09-28 19:55:29.09898');
INSERT INTO public.system_feature_flags VALUES ('ACCOUNTS_PAYMENTS', 'Accounts Payment Processing', 'Allows accounting staff to record collections, debit vouchers, and contra entries', 'FINANCE', true, 'SYSTEM', '2026-09-28 19:55:29.09898');
INSERT INTO public.system_feature_flags VALUES ('REPORTS_GENERATION', 'Financial & Ledger Reports', 'Enables generation and CSV/Excel export of GST ledgers and profitability reports', 'REPORTING', true, 'SYSTEM', '2026-09-28 19:55:29.09898');
INSERT INTO public.system_feature_flags VALUES ('NEW_CUSTOMER_CREATION', 'Client Onboarding', 'Allows creating new client masters with credit policies and GSTINs', 'MASTERS', true, 'SYSTEM', '2026-09-28 19:55:29.09898');
INSERT INTO public.system_feature_flags VALUES ('ONLINE_APIS', 'External REST API Gateways', 'Enables partner ERP and tracking webhooks', 'INTEGRATIONS', true, 'SYSTEM', '2026-09-28 19:55:29.09898');
INSERT INTO public.system_feature_flags VALUES ('MAINTENANCE_OVERRIDE', 'Admin Emergency Bypass', 'Allows Super Admins to bypass maintenance restriction filters', 'SECURITY', true, 'SYSTEM', '2026-09-28 19:55:29.09898');


--
-- Data for Name: trip_status_history; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.trip_status_history VALUES (1, 'TRP-11132', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-22 15:52:37.65072');
INSERT INTO public.trip_status_history VALUES (2, 'TRP-17028', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-22 20:27:29.346075');
INSERT INTO public.trip_status_history VALUES (3, 'TRP-15923', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-23 19:53:57.704215');
INSERT INTO public.trip_status_history VALUES (4, 'TRP-15924', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-23 20:37:38.632745');
INSERT INTO public.trip_status_history VALUES (5, 'TRP-15925', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-23 20:43:55.115092');
INSERT INTO public.trip_status_history VALUES (6, 'TRP-15926', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-23 20:43:55.138758');
INSERT INTO public.trip_status_history VALUES (7, 'TRP-15927', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-23 20:44:35.4643');
INSERT INTO public.trip_status_history VALUES (8, 'TRP-13173', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 14:07:56.314404');
INSERT INTO public.trip_status_history VALUES (9, 'TRP-13174', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 14:07:56.378476');
INSERT INTO public.trip_status_history VALUES (10, 'TRP-13175', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 14:07:56.40546');
INSERT INTO public.trip_status_history VALUES (11, 'TRP-13176', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 14:07:56.433053');
INSERT INTO public.trip_status_history VALUES (12, 'TRP-13177', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 14:07:56.461063');
INSERT INTO public.trip_status_history VALUES (13, 'TRP-13178', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 14:07:56.489595');
INSERT INTO public.trip_status_history VALUES (14, 'TRP-13179', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 14:07:56.512588');
INSERT INTO public.trip_status_history VALUES (15, 'TRP-17663', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 17:24:11.94065');
INSERT INTO public.trip_status_history VALUES (16, 'TRP-17664', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 17:24:12.003168');
INSERT INTO public.trip_status_history VALUES (17, 'TRP-17665', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 17:24:12.029315');
INSERT INTO public.trip_status_history VALUES (18, 'TRP-17666', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 17:24:12.057347');
INSERT INTO public.trip_status_history VALUES (19, 'TRP-17667', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 17:24:12.083205');
INSERT INTO public.trip_status_history VALUES (20, 'TRP-17668', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 17:24:12.1104');
INSERT INTO public.trip_status_history VALUES (21, 'TRP-17669', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 17:24:12.214896');
INSERT INTO public.trip_status_history VALUES (22, 'TRP-12254', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 19:17:36.320909');
INSERT INTO public.trip_status_history VALUES (23, 'TRP-12255', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 19:17:36.381437');
INSERT INTO public.trip_status_history VALUES (24, 'TRP-12256', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 19:17:36.405433');
INSERT INTO public.trip_status_history VALUES (25, 'TRP-12257', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 19:17:36.431596');
INSERT INTO public.trip_status_history VALUES (26, 'TRP-12258', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 19:17:36.45659');
INSERT INTO public.trip_status_history VALUES (27, 'TRP-12259', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 19:17:36.482593');
INSERT INTO public.trip_status_history VALUES (28, 'TRP-12260', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 19:17:36.578486');
INSERT INTO public.trip_status_history VALUES (29, 'TRP-12261', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 19:17:52.896948');
INSERT INTO public.trip_status_history VALUES (30, 'TRP-12262', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 20:02:31.769835');
INSERT INTO public.trip_status_history VALUES (31, 'TRP-12263', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 20:02:31.79538');
INSERT INTO public.trip_status_history VALUES (32, 'TRP-12264', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 20:02:31.812375');
INSERT INTO public.trip_status_history VALUES (33, 'TRP-12265', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 20:02:31.83138');
INSERT INTO public.trip_status_history VALUES (34, 'TRP-12266', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 20:02:31.848953');
INSERT INTO public.trip_status_history VALUES (35, 'TRP-12267', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 20:02:31.867443');
INSERT INTO public.trip_status_history VALUES (36, 'TRP-12268', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-25 20:02:31.921705');
INSERT INTO public.trip_status_history VALUES (37, 'TRP-14052', NULL, 'DELIVERED', 'Arun Kumar (Dispatcher)', 'Trip created and recorded', '2026-09-26 20:32:30.713697');


--
-- Data for Name: trips; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.trips VALUES ('TRP-11132', '2026-09-18', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', '20 MM Aggregate', 19.50, 'Ton', 'Sri Ramanatha Blue Metals Crusher', 'SRC-BILL-8891', 'Sri Ramanatha Blue Metals Crusher', 'Paramakudi Highway Site KM 42', NULL, NULL, NULL, NULL, NULL, 0.00, 142500.00, 142540.00, 40.00, 780.00, 'Ton', 15210.00, 'DELIVERED', 7, false, NULL, 'Arun Kumar (Dispatcher)', 'Delivered in good condition', NULL, 'INV-0432', 2, '2026-09-22 15:52:37.630841', '2026-09-22 15:52:37.922969', 780.00, 0.00, 0.00, 0.00);
INSERT INTO public.trips VALUES ('TRP-17028', '2026-09-18', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', '20 MM Aggregate', 19.50, 'Ton', 'Sri Ramanatha Blue Metals Crusher', 'SRC-BILL-8891', 'Sri Ramanatha Blue Metals Crusher', 'Paramakudi Highway Site KM 42', NULL, NULL, NULL, NULL, NULL, 0.00, 142500.00, 142540.00, 40.00, 780.00, 'Ton', 15210.00, 'DELIVERED', 7, false, NULL, 'Arun Kumar (Dispatcher)', 'Delivered in good condition', NULL, 'INV-0528', 2, '2026-09-22 20:27:29.330084', '2026-09-22 20:27:29.641124', 780.00, 0.00, 0.00, 0.00);
INSERT INTO public.trips VALUES ('TRP-15923', '2026-09-18', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', '20 MM Aggregate', 19.50, 'Ton', 'Sri Ramanatha Blue Metals Crusher', 'SRC-BILL-8891', 'Sri Ramanatha Blue Metals Crusher', 'Paramakudi Highway Site KM 42', NULL, NULL, NULL, NULL, NULL, 0.00, 142500.00, 142540.00, 40.00, 780.00, 'Ton', 15210.00, 'DELIVERED', 7, false, NULL, 'Arun Kumar (Dispatcher)', 'Delivered in good condition', NULL, 'INV-0423', 2, '2026-09-23 19:53:57.6936', '2026-09-23 19:53:57.92909', 780.00, 0.00, 0.00, 0.00);
INSERT INTO public.trips VALUES ('TRP-15924', '2026-09-18', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', '20 MM Aggregate', 19.50, 'Ton', 'Sri Ramanatha Blue Metals Crusher', 'SRC-BILL-8891', 'Sri Ramanatha Blue Metals Crusher', 'Paramakudi Highway Site KM 42', NULL, NULL, NULL, NULL, NULL, 0.00, 142500.00, 142540.00, 40.00, 780.00, 'Ton', 15210.00, 'DELIVERED', 7, false, NULL, 'Arun Kumar (Dispatcher)', 'Delivered in good condition', NULL, 'INV-0424', 2, '2026-09-23 20:37:38.62595', '2026-09-23 20:37:38.790267', 780.00, 0.00, 0.00, 0.00);
INSERT INTO public.trips VALUES ('TRP-15925', '2026-09-23', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 18.50, 'Ton', 'ABC Crusher', 'VDP-8821', 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, 45200.00, 45250.00, 50.00, 820.00, 'Ton', 15170.00, 'DELIVERED', 7, false, NULL, 'Arun Kumar (Dispatcher)', 'Verified 6-step dispatch entry', NULL, NULL, 0, '2026-09-23 20:43:55.113058', '2026-09-23 20:43:55.113058', 820.00, 0.00, 0.00, 0.00);
INSERT INTO public.trips VALUES ('TRP-15926', '2026-09-23', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'No Load', 0.00, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, 45250.00, 45280.00, 30.00, 0.00, 'Ton', 0.00, 'DELIVERED', 7, true, 'Vehicle repositioning / empty transit', 'Arun Kumar (Dispatcher)', 'Empty repositioning run', NULL, NULL, 0, '2026-09-23 20:43:55.136348', '2026-09-23 20:43:55.136348', 0.00, 0.00, 0.00, 0.00);
INSERT INTO public.trips VALUES ('TRP-15927', '2026-09-18', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', '20 MM Aggregate', 19.50, 'Ton', 'Sri Ramanatha Blue Metals Crusher', 'SRC-BILL-8891', 'Sri Ramanatha Blue Metals Crusher', 'Paramakudi Highway Site KM 42', NULL, NULL, NULL, NULL, NULL, 0.00, 142500.00, 142540.00, 40.00, 780.00, 'Ton', 15210.00, 'DELIVERED', 7, false, NULL, 'Arun Kumar (Dispatcher)', 'Delivered in good condition', NULL, 'INV-0425', 2, '2026-09-23 20:44:35.462297', '2026-09-23 20:44:35.54688', 780.00, 0.00, 0.00, 0.00);
INSERT INTO public.trips VALUES ('TRP-13173', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 1.00, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 850.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 14:07:56.299405', '2026-09-25 14:07:56.299405', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-13174', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 5.00, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 4250.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 14:07:56.375458', '2026-09-25 14:07:56.375458', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-13175', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 10.00, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 8500.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 14:07:56.402458', '2026-09-25 14:07:56.402458', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-13176', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 25.00, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 21250.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 14:07:56.431053', '2026-09-25 14:07:56.431053', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-13177', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 12.50, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 10625.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 14:07:56.457079', '2026-09-25 14:07:56.457079', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-13178', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 25.75, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 21887.50, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 14:07:56.486591', '2026-09-25 14:07:56.486591', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-13179', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 0.00, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 0.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 14:07:56.510583', '2026-09-25 14:07:56.511585', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-17663', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 1.00, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 850.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 17:24:11.92627', '2026-09-25 17:24:11.92627', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-17664', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 5.00, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 4250.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 17:24:11.999684', '2026-09-25 17:24:11.999684', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-17665', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 10.00, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 8500.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 17:24:12.027327', '2026-09-25 17:24:12.027327', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-17666', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 25.00, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 21250.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 17:24:12.054259', '2026-09-25 17:24:12.055255', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-17667', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 12.50, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 10625.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 17:24:12.078931', '2026-09-25 17:24:12.078931', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-17668', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 25.75, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 21887.50, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 17:24:12.108351', '2026-09-25 17:24:12.108351', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-17669', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 25.75, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 920.00, 'Ton', 23690.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', 'Validation test for Ton input and 4-way rate sources', NULL, NULL, 0, '2026-09-25 17:24:12.211808', '2026-09-25 17:24:12.211808', 920.00, 380.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-12254', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 1.00, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 850.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 19:17:36.308466', '2026-09-25 19:17:36.308466', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-12255', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 5.00, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 4250.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 19:17:36.378435', '2026-09-25 19:17:36.378435', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-12256', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 10.00, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 8500.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 19:17:36.403442', '2026-09-25 19:17:36.403442', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-12257', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 25.00, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 21250.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 19:17:36.429591', '2026-09-25 19:17:36.429591', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-12258', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 12.50, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 10625.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 19:17:36.453591', '2026-09-25 19:17:36.453591', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-12259', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 25.75, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 21887.50, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 19:17:36.479589', '2026-09-25 19:17:36.479589', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-12260', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 25.75, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 920.00, 'Ton', 23690.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', 'Validation test for Ton input and 4-way rate sources', NULL, NULL, 0, '2026-09-25 19:17:36.577487', '2026-09-25 19:17:36.577487', 920.00, 380.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-12261', '2026-09-23', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 18.50, 'Ton', 'ABC Crusher', 'VDP-8821', 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, 45200.00, 45250.00, 50.00, 1150.00, 'Ton', 21275.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', 'Verified 6-step dispatch entry', NULL, NULL, 0, '2026-09-25 19:17:52.894423', '2026-09-25 19:17:52.894423', 1150.00, 0.00, 0.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-12262', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 1.00, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 850.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 20:02:31.75584', '2026-09-25 20:02:31.75584', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-12263', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 5.00, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 4250.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 20:02:31.793378', '2026-09-25 20:02:31.793378', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-12264', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 10.00, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 8500.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 20:02:31.811377', '2026-09-25 20:02:31.811377', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-12265', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 25.00, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 21250.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 20:02:31.830378', '2026-09-25 20:02:31.830378', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-12266', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 12.50, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 10625.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 20:02:31.84795', '2026-09-25 20:02:31.84795', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-12267', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 25.75, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 850.00, 'Ton', 21887.50, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', NULL, NULL, NULL, 0, '2026-09-25 20:02:31.866417', '2026-09-25 20:02:31.866417', 850.00, 350.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-12268', '2026-09-25', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', 'Black M-Sand', 25.75, 'Ton', 'ABC Crusher', NULL, 'ABC Crusher Yard', 'K Engineering Site', NULL, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, NULL, 920.00, 'Ton', 23690.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', 'Validation test for Ton input and 4-way rate sources', NULL, NULL, 0, '2026-09-25 20:02:31.920705', '2026-09-25 20:02:31.920705', 920.00, 380.00, 680.00, 28.00);
INSERT INTO public.trips VALUES ('TRP-14052', '2026-09-18', 'CUS-00124', 'K Engineering Infra Projects', '+91 94431 52671', 'TN 58 AB 2345', 'OWN', 'DRV-0012', 'M. Murugan', '+91 98421 66101', '20 MM Aggregate', 18.50, 'Ton', 'Sri Ramanatha Blue Metals Crusher', 'SRC-BILL-8891', 'Sri Ramanatha Blue Metals Crusher', 'Paramakudi Highway Site KM 42', NULL, NULL, NULL, NULL, NULL, 0.00, 142500.00, 142540.00, 40.00, 780.00, 'Ton', 14430.00, 'RUNNING', 5, false, NULL, 'Arun Kumar (Dispatcher)', 'Delivered in good condition', NULL, NULL, 0, '2026-09-26 20:32:30.684376', '2026-09-26 20:32:30.684376', 780.00, 0.00, 0.00, 28.00);


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users VALUES ('USR-003', 'manager', '$2a$10$iCJ/xXPrz7TD0WKe05p8u.Ui3s/OzBlWlF40xu2UXjveUYLqHzqg2', 'S. Senthil (Operations Manager)', 'manager@transflow.in', '+91 98421 88003', 'ROLE_MANAGER', 'ACTIVE', '2026-09-25 20:02:31.391865', '2026-09-22 15:45:06.269432', '2026-09-25 20:02:31.392864');
INSERT INTO public.users VALUES ('USR-005', 'worker', '$2a$10$R3UQQSwSwx.sR6ggLW2ww.4b7FnvRGXxQOdzG1IuRl/wKhdHif1om', 'Arun Kumar (Dispatcher)', 'worker@transflow.in', '+91 98421 88005', 'ROLE_WORKER', 'ACTIVE', '2026-09-26 20:32:29.81833', '2026-09-22 15:45:06.269432', '2026-09-26 20:32:30.033397');
INSERT INTO public.users VALUES ('USR-002', 'md', '$2a$10$Wj08Dm3xYiq/S/djp8a4h.Lnm7n9ZxzW57UcZv9Ku.5Ql4.Y.KbDm', 'M. Ramanathan (MD)', 'md@transflow.in', '+91 98421 88002', 'ROLE_MD', 'ACTIVE', '2026-09-26 20:32:30.27647', '2026-09-22 15:45:06.269432', '2026-09-26 20:32:30.277479');
INSERT INTO public.users VALUES ('USR-004', 'accounts', '$2a$10$sPyQuTzuTF5LiuVBNmVJkuGD0pWF5pCD88dWtbjEtfD.kdpjGw4za', 'K. Venkat (Senior Accountant)', 'accounts@transflow.in', '+91 98421 88004', 'ROLE_ACCOUNTS', 'ACTIVE', '2026-09-26 20:32:30.463896', '2026-09-22 15:45:06.269432', '2026-09-26 20:32:30.465305');
INSERT INTO public.users VALUES ('USR-001', 'admin', '$2a$10$x0yOLTeYQn1atSQ62txJhuulQH1UAQPrEK9XgkkOsWnEpx839bOGm', 'System Administrator', 'admin@transflow.in', '+91 98421 88001', 'ROLE_ADMIN', 'ACTIVE', '2026-09-28 20:10:39.548864', '2026-09-22 15:45:06.269432', '2026-09-28 20:10:39.551295');


--
-- Data for Name: vehicle_expenses; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: vehicles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.vehicles VALUES ('TN 58 AB 2345', '10-Wheel Tipper', 'OWN', '18 Ton', '180 L', 142500.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AVAILABLE', '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');
INSERT INTO public.vehicles VALUES ('TN 65 CD 8821', '12-Wheel Tipper', 'OWN', '20 Ton', '220 L', 98400.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AVAILABLE', '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');
INSERT INTO public.vehicles VALUES ('TN 58 EF 4410', '10-Wheel Tipper', 'OWN', '18 Ton', '180 L', 210500.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AVAILABLE', '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');
INSERT INTO public.vehicles VALUES ('TN 67 GH 9901', '6-Wheel Medium Tipper', 'RENTED', '12 Ton', '140 L', 65200.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'AVAILABLE', '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');


--
-- Data for Name: wage_advances; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: worker_wages; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: workers; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.workers VALUES ('WRK-0024', 'Arun Kumar', '+91 98421 88005', 'arun@transflow.in', 'Data Entry Operator', 'WORKER', 18000.00, 0.00, 0.00, 0.00, NULL, 'ACTIVE', NULL, '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');
INSERT INTO public.workers VALUES ('WRK-0025', 'S. Senthil', '+91 98421 88003', 'senthil@transflow.in', 'Supervisor', 'MANAGER', 35000.00, 0.00, 0.00, 0.00, NULL, 'ACTIVE', NULL, '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');
INSERT INTO public.workers VALUES ('WRK-0026', 'K. Venkat', '+91 98421 88004', 'venkat@transflow.in', 'Accounts', 'ACCOUNTS', 40000.00, 0.00, 0.00, 0.00, NULL, 'ACTIVE', NULL, '2026-09-22 15:45:06.269432', '2026-09-22 15:45:06.269432');


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 5, true);


--
-- Name: correction_request_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.correction_request_items_id_seq', 5, true);


--
-- Name: invoice_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoice_items_id_seq', 5, true);


--
-- Name: payment_allocations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.payment_allocations_id_seq', 5, true);


--
-- Name: trip_status_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.trip_status_history_id_seq', 37, true);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: backup_records backup_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_records
    ADD CONSTRAINT backup_records_pkey PRIMARY KEY (id);


--
-- Name: backup_schedules backup_schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backup_schedules
    ADD CONSTRAINT backup_schedules_pkey PRIMARY KEY (id);


--
-- Name: cash_bank_accounts cash_bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cash_bank_accounts
    ADD CONSTRAINT cash_bank_accounts_pkey PRIMARY KEY (id);


--
-- Name: company_settings company_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_pkey PRIMARY KEY (id);


--
-- Name: configured_rates configured_rates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configured_rates
    ADD CONSTRAINT configured_rates_pkey PRIMARY KEY (id);


--
-- Name: contra_transfers contra_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contra_transfers
    ADD CONSTRAINT contra_transfers_pkey PRIMARY KEY (id);


--
-- Name: correction_request_items correction_request_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.correction_request_items
    ADD CONSTRAINT correction_request_items_pkey PRIMARY KEY (id);


--
-- Name: correction_requests correction_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.correction_requests
    ADD CONSTRAINT correction_requests_pkey PRIMARY KEY (id);


--
-- Name: customers customers_phone_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_phone_key UNIQUE (phone);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: diesel_logs diesel_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diesel_logs
    ADD CONSTRAINT diesel_logs_pkey PRIMARY KEY (id);


--
-- Name: drivers drivers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.drivers
    ADD CONSTRAINT drivers_pkey PRIMARY KEY (id);


--
-- Name: financial_transactions financial_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.financial_transactions
    ADD CONSTRAINT financial_transactions_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history flyway_schema_history_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.flyway_schema_history
    ADD CONSTRAINT flyway_schema_history_pk PRIMARY KEY (installed_rank);


--
-- Name: fuel_stations fuel_stations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fuel_stations
    ADD CONSTRAINT fuel_stations_pkey PRIMARY KEY (id);


--
-- Name: invoice_items invoice_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: locations locations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.locations
    ADD CONSTRAINT locations_pkey PRIMARY KEY (id);


--
-- Name: materials materials_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_name_key UNIQUE (name);


--
-- Name: materials materials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.materials
    ADD CONSTRAINT materials_pkey PRIMARY KEY (id);


--
-- Name: payment_allocations payment_allocations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_allocations
    ADD CONSTRAINT payment_allocations_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sources sources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sources
    ADD CONSTRAINT sources_pkey PRIMARY KEY (id);


--
-- Name: system_control system_control_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_control
    ADD CONSTRAINT system_control_pkey PRIMARY KEY (id);


--
-- Name: system_feature_flags system_feature_flags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_feature_flags
    ADD CONSTRAINT system_feature_flags_pkey PRIMARY KEY (flag_key);


--
-- Name: trip_status_history trip_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_status_history
    ADD CONSTRAINT trip_status_history_pkey PRIMARY KEY (id);


--
-- Name: trips trips_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: vehicle_expenses vehicle_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_expenses
    ADD CONSTRAINT vehicle_expenses_pkey PRIMARY KEY (id);


--
-- Name: vehicles vehicles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicles
    ADD CONSTRAINT vehicles_pkey PRIMARY KEY (registration);


--
-- Name: wage_advances wage_advances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.wage_advances
    ADD CONSTRAINT wage_advances_pkey PRIMARY KEY (id);


--
-- Name: worker_wages worker_wages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.worker_wages
    ADD CONSTRAINT worker_wages_pkey PRIMARY KEY (id);


--
-- Name: workers workers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.workers
    ADD CONSTRAINT workers_pkey PRIMARY KEY (id);


--
-- Name: flyway_schema_history_s_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX flyway_schema_history_s_idx ON public.flyway_schema_history USING btree (success);


--
-- Name: idx_advances_recipient; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_advances_recipient ON public.wage_advances USING btree (recipient_type, recipient_id);


--
-- Name: idx_allocations_invoice; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_allocations_invoice ON public.payment_allocations USING btree (invoice_id);


--
-- Name: idx_allocations_payment; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_allocations_payment ON public.payment_allocations USING btree (payment_id);


--
-- Name: idx_audit_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_date ON public.audit_logs USING btree (performed_at);


--
-- Name: idx_audit_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_entity ON public.audit_logs USING btree (entity_type, entity_id);


--
-- Name: idx_audit_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_user ON public.audit_logs USING btree (performed_by);


--
-- Name: idx_backup_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_backup_created ON public.backup_records USING btree (created_at DESC);


--
-- Name: idx_backup_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_backup_status ON public.backup_records USING btree (status);


--
-- Name: idx_corr_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_corr_entity ON public.correction_requests USING btree (entity_type, entity_id);


--
-- Name: idx_corr_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_corr_status ON public.correction_requests USING btree (status);


--
-- Name: idx_customers_phone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_phone ON public.customers USING btree (phone);


--
-- Name: idx_diesel_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_diesel_date ON public.diesel_logs USING btree (date);


--
-- Name: idx_diesel_vehicle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_diesel_vehicle ON public.diesel_logs USING btree (vehicle_registration);


--
-- Name: idx_drivers_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_drivers_status ON public.drivers USING btree (status);


--
-- Name: idx_expenses_vehicle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_vehicle ON public.vehicle_expenses USING btree (vehicle_registration);


--
-- Name: idx_fin_txns_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_txns_date ON public.financial_transactions USING btree (date);


--
-- Name: idx_fin_txns_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_txns_entity ON public.financial_transactions USING btree (entity_type, entity_id);


--
-- Name: idx_fin_txns_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fin_txns_type ON public.financial_transactions USING btree (transaction_type);


--
-- Name: idx_invoice_items_invoice_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items USING btree (invoice_id);


--
-- Name: idx_invoice_items_trip_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoice_items_trip_id ON public.invoice_items USING btree (trip_id);


--
-- Name: idx_invoices_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_customer_id ON public.invoices USING btree (customer_id);


--
-- Name: idx_invoices_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_date ON public.invoices USING btree (date);


--
-- Name: idx_invoices_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_invoices_status ON public.invoices USING btree (status);


--
-- Name: idx_payments_customer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_customer ON public.payments USING btree (customer_id);


--
-- Name: idx_payments_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_payments_date ON public.payments USING btree (date);


--
-- Name: idx_rates_lookup; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_rates_lookup ON public.configured_rates USING btree (customer_id, material, loading_location, delivery_location);


--
-- Name: idx_trips_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_customer_id ON public.trips USING btree (customer_id);


--
-- Name: idx_trips_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_date ON public.trips USING btree (date);


--
-- Name: idx_trips_driver_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_driver_id ON public.trips USING btree (driver_id);


--
-- Name: idx_trips_invoice_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_invoice_id ON public.trips USING btree (invoice_id);


--
-- Name: idx_trips_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_status ON public.trips USING btree (status);


--
-- Name: idx_trips_vehicle; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trips_vehicle ON public.trips USING btree (vehicle_registration);


--
-- Name: idx_users_role_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role_id ON public.users USING btree (role_id);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: idx_vehicles_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_vehicles_status ON public.vehicles USING btree (status);


--
-- Name: idx_wages_worker_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wages_worker_id ON public.worker_wages USING btree (worker_id);


--
-- Name: configured_rates configured_rates_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configured_rates
    ADD CONSTRAINT configured_rates_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- Name: configured_rates configured_rates_source_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configured_rates
    ADD CONSTRAINT configured_rates_source_id_fkey FOREIGN KEY (source_id) REFERENCES public.sources(id) ON DELETE CASCADE;


--
-- Name: contra_transfers contra_transfers_from_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contra_transfers
    ADD CONSTRAINT contra_transfers_from_account_id_fkey FOREIGN KEY (from_account_id) REFERENCES public.cash_bank_accounts(id);


--
-- Name: contra_transfers contra_transfers_to_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contra_transfers
    ADD CONSTRAINT contra_transfers_to_account_id_fkey FOREIGN KEY (to_account_id) REFERENCES public.cash_bank_accounts(id);


--
-- Name: correction_request_items correction_request_items_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.correction_request_items
    ADD CONSTRAINT correction_request_items_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.correction_requests(id) ON DELETE CASCADE;


--
-- Name: diesel_logs diesel_logs_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diesel_logs
    ADD CONSTRAINT diesel_logs_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id);


--
-- Name: diesel_logs diesel_logs_fuel_station_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diesel_logs
    ADD CONSTRAINT diesel_logs_fuel_station_id_fkey FOREIGN KEY (fuel_station_id) REFERENCES public.fuel_stations(id);


--
-- Name: diesel_logs diesel_logs_vehicle_registration_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diesel_logs
    ADD CONSTRAINT diesel_logs_vehicle_registration_fkey FOREIGN KEY (vehicle_registration) REFERENCES public.vehicles(registration);


--
-- Name: invoice_items invoice_items_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoice_items
    ADD CONSTRAINT invoice_items_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: payment_allocations payment_allocations_invoice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_allocations
    ADD CONSTRAINT payment_allocations_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);


--
-- Name: payment_allocations payment_allocations_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_allocations
    ADD CONSTRAINT payment_allocations_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE CASCADE;


--
-- Name: payments payments_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.cash_bank_accounts(id);


--
-- Name: payments payments_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: trip_status_history trip_status_history_trip_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trip_status_history
    ADD CONSTRAINT trip_status_history_trip_id_fkey FOREIGN KEY (trip_id) REFERENCES public.trips(id) ON DELETE CASCADE;


--
-- Name: trips trips_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);


--
-- Name: trips trips_driver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES public.drivers(id);


--
-- Name: trips trips_vehicle_registration_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trips
    ADD CONSTRAINT trips_vehicle_registration_fkey FOREIGN KEY (vehicle_registration) REFERENCES public.vehicles(registration);


--
-- Name: users users_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: vehicle_expenses vehicle_expenses_vehicle_registration_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.vehicle_expenses
    ADD CONSTRAINT vehicle_expenses_vehicle_registration_fkey FOREIGN KEY (vehicle_registration) REFERENCES public.vehicles(registration);


--
-- PostgreSQL database dump complete
--

\unrestrict dUJsEc2cdDtkUnp0rijFDmjJgs8zoD0XPFaXF4f9hprqqgGTOZoZGEP2KFcpULT

