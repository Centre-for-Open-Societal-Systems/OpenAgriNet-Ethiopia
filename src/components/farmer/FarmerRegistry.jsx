import React, {useState, useEffect, useRef, useMemo, useCallback} from 'react';
import {NavLink} from 'react-router-dom';
import './FarmerDashboard.css';
import '../common/ContentArea.css';
import './FarmerRegistry.css';
import {
    Home,
    Users,
    User,
    MapPin,
    Bird,
    Sprout,
    Mountain,
    Shield,
    Download,
    Database,
    BarChart2,
    Settings,
    ChevronDown,
    Bell,
    Globe,
    HelpCircle,
    Info,
    Menu,
    TrendingUp,
    TrendingDown,
    Calendar,
    LogOut,
    Briefcase,
    Activity,
    Server,
    FileText,
    CloudRain,
    Sun,
    Moon,
    Languages,
    UserCircle,
    Landmark,
    Building2,
    LayoutDashboard,
    FileSpreadsheet,
    Beef,
    Wheat,
    X,
    History,
    ClipboardCheck,
    UserPlus,
    Search,
    Eye,
    Printer,
    Check,
    Edit,
    Trash2,
    Plus,
    CheckCircle,
    Clock,
    AlertCircle,
    Map,
    ShieldCheck,
    Timer,
    MoreVertical,
    Phone,
    Mail,
    ArrowUpDown,
    XCircle,
    Filter,
    Smartphone,
    Layout,
    Upload,
    ArrowLeft,
    Maximize2,
    Minimize2
} from 'lucide-react';

// Farmer-specific components
import FarmerSidebar from './FarmerSidebar';
import {StatCard} from './FarmerStats';
import TopHeader from '../common/TopHeader';
import PageHeader from '../common/PageHeader';
import FarmerRegistrationForm from './FarmerRegistrationForm';
import * as XLSX from 'xlsx';
import {
    REGISTRY_STATUSES,
    migrateFarmers,
    normalizeFarmer,
    statusCssClass,
    createAuditEntry,
    findFarmerWithFaydaId,
    distinctWoredas,
    maskFaydaId,
    nowIso,
} from './farmerRegistryModel';
import {
    StatusUpdateModal, FaydaVerifyModal, AuditLogModal, SoftDeleteModal, SelectAllPagesModal, BulkActionModal,
} from './FarmerRegistryDialogs';

const FarmerRegistry = ({
                            userRole,
                            onRoleChange,
                            onLogout,
                            overviewPath = '/dashboard/overview',
                            extraSidebar = null,
                            extraSidebarFooter = null,
                        }) => {
    const [theme, setTheme] = useState('light');
    const [language, setLanguage] = useState('en');
    const [isHelpOpen, setIsHelpOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
    const [openActionMenuId, setOpenActionMenuId] = useState(null);
    const [selectedFarmers, setSelectedFarmers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({key: 'registeredDate', direction: 'desc'});
    const [searchTerm, setSearchTerm] = useState('');
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedStatuses, setSelectedStatuses] = useState([...REGISTRY_STATUSES]);
    const [selectedRegions, setSelectedRegions] = useState(['All Regions']);
    const [selectedWoredas, setSelectedWoredas] = useState(['All Woredas']);
    const [regionFilterOpen, setRegionFilterOpen] = useState(false);
    const [statusFilterOpen, setStatusFilterOpen] = useState(false);
    const [woredaFilterOpen, setWoredaFilterOpen] = useState(false);
    const [statusModalFarmer, setStatusModalFarmer] = useState(null);
    const [faydaModalFarmer, setFaydaModalFarmer] = useState(null);
    const [auditModalFarmer, setAuditModalFarmer] = useState(null);
    const [deleteModalFarmer, setDeleteModalFarmer] = useState(null);
    const [bulkModal, setBulkModal] = useState(null);
    const [selectAllPagesOpen, setSelectAllPagesOpen] = useState(false);
    const [bulkResultMessage, setBulkResultMessage] = useState(null);
    const [registrationSuccess, setRegistrationSuccess] = useState(null);
    const [showDownloadOptions, setShowDownloadOptions] = useState(false);
    const [exportMessage, setExportMessage] = useState(null);
    const [activeTab, setActiveTab] = useState('list');
    const [editingFarmer, setEditingFarmer] = useState(null);
    const [viewingFarmer, setViewingFarmer] = useState(null);
    const [activeProfileTab, setActiveProfileTab] = useState('Personal Info');
    const [showIdPreview, setShowIdPreview] = useState(false);
    const [showRecordPreview, setShowRecordPreview] = useState(false);
    const [viewingDocument, setViewingDocument] = useState(null);
    const [docUploadType, setDocUploadType] = useState('Select Type...');
    const [docUploadFile, setDocUploadFile] = useState('');
    const [selectedFileObj, setSelectedFileObj] = useState(null);
    const [isDocTypeOpen, setIsDocTypeOpen] = useState(false);
    const fileInputRef = useRef(null);

// ── CDC Live Feed State ─────────────────────────────────────────
    const [walEvents, setWalEvents] = useState([]);
    const [airflowEvents, setAirflowEvents] = useState([]);
    const [wsConnected, setWsConnected] = useState(false);
    const wsRef = useRef(null);

    useEffect(() => {
        const connect = () => {
            const ws = new WebSocket('ws://localhost:8765');
            wsRef.current = ws;

            ws.onopen = () => {
                setWsConnected(true);
                console.log('[OAN] WebSocket connected');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'connected') return;

                    const entry = {
                        id: Date.now() + Math.random(),
                        timestamp: data.timestamp || new Date().toISOString(),
                        table: data.table || '—',
                        operation: data.operation || 'CHANGE',
                        pipeline_label: data.pipeline_label || '',
                        source: data.source || 'unknown',
                    };

                    if (data.source === 'airflow_cdc' || data.type === 'airflow_cdc_batch') {
                        const changes = data.changes || [data];
                        changes.forEach(change => {
                            setAirflowEvents(prev => [{
                                id: Date.now() + Math.random(),
                                timestamp: change.timestamp || new Date().toISOString(),
                                table: change.table || '—',
                                operation: change.operation || 'CHANGE_DETECTED',
                                pipeline_label: '🟡 Airflow CDC (1-min poll)',
                            }, ...prev].slice(0, 20));
                        });
                    } else {
                        setWalEvents(prev => [entry, ...prev].slice(0, 20));
                    }
                } catch (e) {
                    console.error('[OAN] WS parse error', e);
                }
            };

            ws.onclose = () => {
                setWsConnected(false);
                console.log('[OAN] WebSocket disconnected, retrying in 3s...');
                setTimeout(connect, 3000);
            };

            ws.onerror = (err) => {
                console.error('[OAN] WebSocket error', err);
                ws.close();
            };
        };

        connect();
        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const regions = ['Addis Ababa', 'Afar', 'Amhara', 'Benishangul-Gumuz', 'Dire Dawa', 'Gambela', 'Harari', 'Oromia', 'Sidama', 'Somali', 'Southern Nations, Nationalities, and Peoples\' Region', 'Tigray'];

    const regionFilterRef = useRef(null);
    const statusFilterRef = useRef(null);
    const woredaFilterRef = useRef(null);
    const helpWindowRef = useRef(null);
    const downloadMenuRef = useRef(null);
    const registryTableFullscreenRef = useRef(null);
    const [isRegistryTableFullscreen, setIsRegistryTableFullscreen] = useState(false);

    const getFullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;

    const enterRegistryTableFullscreen = () => {
        const el = registryTableFullscreenRef.current;
        if (!el) return;
        const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
        if (req) {
            Promise.resolve(req.call(el)).catch(() => {
            });
        }
    };

    const exitRegistryTableFullscreen = () => {
        const d = document;
        const exit = d.exitFullscreen || d.webkitExitFullscreen || d.mozCancelFullScreen || d.msExitFullscreen;
        if (exit) {
            Promise.resolve(exit.call(d)).catch(() => {
            });
        }
    };

    useEffect(() => {
        const syncFullscreen = () => {
            setIsRegistryTableFullscreen(getFullscreenElement() === registryTableFullscreenRef.current);
        };
        document.addEventListener('fullscreenchange', syncFullscreen);
        document.addEventListener('webkitfullscreenchange', syncFullscreen);
        document.addEventListener('mozfullscreenchange', syncFullscreen);
        document.addEventListener('MSFullscreenChange', syncFullscreen);
        return () => {
            document.removeEventListener('fullscreenchange', syncFullscreen);
            document.removeEventListener('webkitfullscreenchange', syncFullscreen);
            document.removeEventListener('mozfullscreenchange', syncFullscreen);
            document.removeEventListener('MSFullscreenChange', syncFullscreen);
        };
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (helpWindowRef.current && !helpWindowRef.current.contains(event.target)) setIsHelpOpen(false);
            if (regionFilterRef.current && !regionFilterRef.current.contains(event.target)) setRegionFilterOpen(false);
            if (statusFilterRef.current && !statusFilterRef.current.contains(event.target)) setStatusFilterOpen(false);
            if (woredaFilterRef.current && !woredaFilterRef.current.contains(event.target)) setWoredaFilterOpen(false);
            if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target)) setShowDownloadOptions(false);
            if (!event.target.closest('.actions-col')) setOpenActionMenuId(null);
            if (!event.target.closest('.custom-doc-select-v6')) setIsDocTypeOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    const generateFarmers = () => {
        const maleNames = ['Abebe', 'Bekele', 'Tadesse', 'Tesfaye', 'Girma', 'Hailu', 'Kassahun', 'Lema', 'Mulugeta', 'Sintayehu', 'Yidnekachew', 'Belay', 'Fikadu', 'Getachew', 'Habtamu', 'Iskinder', 'Kebede', 'Nigussie'];
        const femaleNames = ['Meskerem', 'Birtukan', 'Hirut', 'Nigist', 'Zenebech', 'Aster', 'Chaltu', 'Dibaba', 'Elen', 'Jember', 'Lula', 'Marta'];
        const surnames = ['Bekele', 'Wolde', 'Tadesse', 'Abera', 'Hailu', 'Kassa', 'Mekonnen', 'Gizaw', 'Assefa', 'Demissie', 'Tsegaye', 'Desta', 'Kidus', 'Zerihun', 'Alemu', 'Gebre', 'Ayele', 'Zeleke', 'Mulu', 'Lemma'];
        const regionList = ['Addis Ababa', 'Oromia', 'Amhara', 'Tigray', 'Sidama', 'Somali'];
        const kebeleList = ['Kebele 01', 'Kebele 05', 'Kebele 07', 'Kebele 11', 'Kebele 12', 'Kebele 20', 'Kebele 25', 'Kebele 32'];
        const cropList = ['Wheat', 'Sugarcane', 'Rice', 'Maize', 'Vegetables', 'Mustard', 'Bajra', 'Cotton', 'Coconut', 'Groundnut'];
        const phonePrefixes = ['+251 91', '+251 92', '+251 93', '+251 94', '+251 95'];
        const livelihoods = ['Crops', 'Livestock', 'Mixed', 'Other'];
        const localSuffix = ['ደራስ', 'መኮንን', 'ወልደ', 'ተስፋ'];

        return Array.from({length: 75}, (_, i) => {
            const isMale = i % 2 === 0;
            const first = isMale ? maleNames[i % maleNames.length] : femaleNames[i % femaleNames.length];
            const last = surnames[i % surnames.length];
            const nameEn = `${first} ${last}`;
            const nameLocal = `${localSuffix[i % localSuffix.length]} ${first}`;
            const gender = isMale ? 'Male' : 'Female';
            const registryStatus = REGISTRY_STATUSES[i % REGISTRY_STATUSES.length];
            const region = regionList[i % regionList.length];
            const woreda = `Woreda ${(i % 15) + 1}`;
            const ageYears = 25 + (i % 40);
            const hasFayda = i % 3 !== 0;
            const faydaId = hasFayda ? `FAYDA-${(100000 + i).toString()}` : '';
            const dobDate = new Date(1990 + (i % 20), (i % 12), (i % 27) + 1);
            const dob = dobDate.toISOString().split('T')[0];

            const row = {
                id: `OAN-FR-${(i + 1).toString().padStart(3, '0')}`,
                name: nameEn,
                fullNameLatin: nameEn,
                fullNameAmharic: nameLocal,
                fullNameLocal: nameLocal,
                photo: `https://randomuser.me/api/portraits/${isMale ? 'men' : 'women'}/${i % 70}.jpg`,
                gender,
                ageYears,
                age: `${ageYears} Yrs`,
                dob,
                phone: `${phonePrefixes[i % 5]} ${Math.floor(1000000 + Math.random() * 9000000)}`,
                email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@gmail.com`,
                kebele: kebeleList[i % kebeleList.length],
                woreda,
                region,
                village: `Village ${(i % 5) + 1}`,
                registeredDate: `2024-${(i % 3) + 1}-${(i % 28) + 1}`,
                registrationDateField: `2024-${(i % 3) + 1}-${(i % 28) + 1}`,
                acres: `${(Math.random() * 15).toFixed(1)} Acres`,
                crops: [cropList[i % cropList.length], cropList[(i + 1) % cropList.length]],
                registryStatus,
                status: registryStatus,
                kisanCard: i % 4 === 0 ? 'Inactive' : 'Active',
                faydaId,
                nationalId: faydaId,
                livelihood: livelihoods[i % livelihoods.length],
                verificationStatus: faydaId ? (i % 11 === 0 ? 'Pending' : 'Verified') : 'Unverified',
                verificationDate: faydaId && i % 11 !== 0 ? `2024-02-${(i % 27) + 1}` : '',
                verifiedBy: faydaId && i % 11 !== 0 ? 'verifier-001' : '',
                householdSize: 4 + (i % 6),
                notes: '',
                deleted: false,
            };
            return normalizeFarmer(row, i);
        });
    };

    // const [farmers, setFarmers] = useState(() => {
    //     const savedFarmers = localStorage.getItem('oan_farmers');
    //     if (savedFarmers) {
    //         try {
    //             return migrateFarmers(JSON.parse(savedFarmers));
    //         } catch (e) {
    //             console.error("Failed to parse saved farmers", e);
    //             return migrateFarmers(generateFarmers());
    //         }
    //     }
    //     const initialFarmers = migrateFarmers(generateFarmers());
    //     localStorage.setItem('oan_farmers', JSON.stringify(initialFarmers));
    //     return initialFarmers;
    // });
    //
    // // Save to localStorage whenever farmers change
    // useEffect(() => {
    //     localStorage.setItem('oan_farmers', JSON.stringify(farmers));
    // }, [farmers]);

    const [farmers, setFarmers] = useState([]);
    const [farmersLoading, setFarmersLoading] = useState(true);

    // Fetch real farmers from OpenG2P CDC API
    useEffect(() => {
        fetch('http://localhost:8001/farmers?limit=100')
            .then((res) => res.json())
            .then((data) => {
                const normalized = migrateFarmers(data.map((f) => {
                    // Build full Amharic name from parts
                    const amhParts = [f.first_name_amh, f.family_name_amh, f.gf_name_amh].filter(Boolean);
                    const fullNameAmharic = amhParts.length > 0 ? amhParts.join(' ') : (f.name || '');

                    // Build full English name from parts
                    const engParts = [f.given_name, f.family_name, f.gf_name_eng].filter(Boolean);
                    const fullNameLatin = engParts.length > 0 ? engParts.join(' ') : (f.name || 'Unknown');

                    // Capitalise status
                    const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : 'Active';

                    // Age from DB
                    const ageYears = f.age_int && f.age_int > 0 ? f.age_int : null;

                    return {
                        // IDs
                        id: `OAN-FR-${f.id}`,
                        dbId: f.id,
                        farmerId: f.farmer_id || '',
                        unique_id: f.unique_id || '',

                        // Names
                        name: f.name || 'Unknown',
                        fullNameLatin,
                        fullNameAmharic,
                        fullNameLocal: fullNameAmharic,

                        // Contact
                        gender: f.gender || '',
                        phone: f.phone || f.mobile || '',
                        mobile: f.mobile || '',
                        email: f.email || '',

                        // Age / DOB
                        ageYears: ageYears || 30,
                        age: ageYears ? `${ageYears} Yrs` : '—',
                        dob: f.birthdate || '',
                        birth_place: f.birth_place || '',

                        // Location
                        region: f.region || '',
                        zone: f.zone || '',
                        woreda: f.woreda || '',
                        kebele: f.kebele || '',
                        village: f.village || f.street || '',

                        // Status
                        registryStatus: cap(f.approval_status),
                        status: cap(f.approval_status),
                        registeredDate: f.registration_date || '',
                        registrationDateField: f.registration_date || '',

                        // IDs
                        faydaId: f.unique_id || '',
                        nationalId: f.unique_id || '',

                        // Farming
                        farming_type: f.farming_type || '',
                        land_ownership: f.land_ownership || '',
                        total_land_area: f.total_land_area || 0,
                        total_land_owned_area: f.total_land_owned_area || 0,
                        total_land_rent_area: f.total_land_rent_area || 0,
                        total_land_crop_sharing_area: f.total_land_crop_sharing_area || 0,
                        landHoldings: f.total_land_area ? `${f.total_land_area} ha` : '—',
                        acres: f.total_land_area ? `${f.total_land_area} ha` : '—',

                        // Household
                        householdSize: f.size_of_family || 0,
                        size_of_family: f.size_of_family || 0,
                        number_of_males_in_family: f.number_of_males_in_family || 0,
                        number_of_females_in_family: f.number_of_females_in_family || 0,
                        number_of_children_in_family: f.number_of_children_in_family || 0,
                        hh_is_household_head: f.hh_is_household_head || '',

                        // Cooperatives / Commodity
                        primaryActivity: f.farming_type || '',
                        primaryLivelihood: f.farming_type || '',
                        primary_cooperatives: f.primary_cooperatives || '',
                        cooperative_unions: f.cooperative_unions || '',
                        primary_commodity: f.primary_commodity || '',
                        cooperatives: f.primary_cooperatives ? [f.primary_cooperatives] : [],
                        agricultureType: f.primary_commodity ? [f.primary_commodity] : [],

                        // Agricultural inputs
                        do_you_use_fertilizer: f.do_you_use_fertilizer || '',
                        do_you_use_pesticide: f.do_you_use_pesticide || '',
                        do_you_use_improved_seed: f.do_you_use_improved_seed || '',
                        access_to_machinery: f.access_to_machinery || '',
                        irrigation_types: f.irrigation_types || '',
                        has_finance_access: f.has_finance_access || '',

                        // Socioeconomic
                        income: f.income || 0,
                        annual_income: f.annual_income || '',
                        incomeValue: f.income || 0,
                        incomeCurrency: {code: 'ETB'},
                        employment_status: f.employment_status || '',
                        marital_status: f.marital_status || f.martial_status || '',
                        education_level: f.education_level || '',
                        housing_type: f.housing_type || '',
                        water_access: f.water_access || '',
                        electricity_access: f.electricity_access || '',
                        owns_livestock: f.owns_livestock || '',
                        owns_house: f.owns_house || '',
                        is_psnp_user: f.is_psnp_user || false,

                        // Disability
                        is_disabled: f.is_disabled || '',
                        type_of_disability: f.type_of_disability || '',
                        num_disabled: f.num_disabled || 0,

                        // Membership
                        is_member_of_primary_cooperative: f.is_member_of_primary_cooperative || '',
                        is_member_of_cooperative_union: f.is_member_of_cooperative_union || '',
                        is_member_in_farmer_cluster: f.is_member_in_farmer_cluster || '',
                        role_in_farmer_cluster: f.role_in_farmer_cluster || '',

                        // GPS
                        latitude: f.partner_latitude || null,
                        longitude: f.partner_longitude || null,

                        deleted: false,
                    };
                }));
                setFarmers(normalized);
                setFarmersLoading(false);
            })
            .catch((err) => {
                console.error('Failed to fetch farmers from API:', err);
                // fallback to generated data if API is down
                setFarmers(migrateFarmers(generateFarmers()));
                setFarmersLoading(false);
            });
    }, []);

    const handleNewRegistration = (newReg, opts = {}) => {
        const ageYears = newReg.dob ? new Date().getFullYear() - new Date(newReg.dob).getFullYear() : parseInt(String(newReg.ageYears || '').replace(/\D/g, ''), 10) || 32;

        if (editingFarmer) {
            const prev = farmers.find((x) => x.id === editingFarmer.id);
            const updatedFarmers = farmers.map((f) => {
                if (f.id !== editingFarmer.id) return f;
                const merged = normalizeFarmer({
                    ...f, ...newReg,
                    fullNameLatin: newReg.fullNameLatin || newReg.fullNameAmharic || f.fullNameLatin,
                    fullNameAmharic: newReg.fullNameAmharic || f.fullNameAmharic,
                    fullNameLocal: newReg.fullNameAmharic || f.fullNameLocal,
                    name: newReg.fullNameLatin || newReg.fullNameAmharic || f.name,
                    photo: newReg.photoUrl || f.photo,
                    phone: newReg.mobileNumber,
                    email: newReg.email || f.email,
                    acres: `${newReg.landHoldings || 0} Acres`,
                    crops: newReg.agricultureType || f.crops,
                    ageYears,
                    age: newReg.dob ? `${ageYears} Yrs` : f.age,
                    dob: newReg.dob || f.dob,
                    kebele: newReg.kebele,
                    woreda: newReg.woreda,
                    region: newReg.region,
                    village: newReg.village || f.village,
                    householdSize: parseInt(newReg.householdSize, 10) || f.householdSize,
                    livelihood: newReg.primaryLivelihood || newReg.primaryActivity || f.livelihood,
                    faydaId: newReg.faydaId || newReg.nationalId || f.faydaId,
                    nationalId: newReg.nationalId || newReg.faydaId || f.nationalId,
                    notes: newReg.notes != null ? newReg.notes : f.notes,
                    registrationDateField: newReg.registrationDate || f.registrationDateField,
                    registeredDate: newReg.registrationDate || f.registeredDate,
                    lastUpdatedBy: 'current-user',
                    lastUpdatedAt: nowIso(),
                    auditLog: [createAuditEntry({
                        type: 'Profile Updated',
                        farmerId: f.id,
                        message: 'Profile updated from registration form.',
                        before: {name: prev?.name, region: prev?.region},
                        after: {name: newReg.fullNameLatin || newReg.fullNameAmharic, region: newReg.region},
                    }), ...(f.auditLog || []),],
                });
                return merged;
            });
            setFarmers(updatedFarmers);
            setActiveTab('list');
            setSearchTerm('');
            setEditingFarmer(null);
            return;
        }

        const nextId = farmers.length > 0 ? Math.max(...farmers.map((f) => parseInt(f.id.split('-').pop(), 10) || 0), 0) + 1 : 1;
        const idStr = `OAN-FR-${nextId.toString().padStart(3, '0')}`;
        const regDate = newReg.registrationDate || new Date().toISOString().split('T')[0];
        const raw = {
            ...newReg,
            id: idStr,
            fullNameLatin: newReg.fullNameLatin || newReg.fullNameAmharic,
            fullNameAmharic: newReg.fullNameAmharic,
            fullNameLocal: newReg.fullNameAmharic,
            name: newReg.fullNameLatin || newReg.fullNameAmharic,
            photo: newReg.photoUrl || `https://randomuser.me/api/portraits/lego/${nextId % 10}.jpg`,
            gender: newReg.gender,
            ageYears,
            age: newReg.dob ? `${ageYears} Yrs` : `${ageYears} Yrs`,
            dob: newReg.dob || '',
            phone: newReg.mobileNumber,
            email: newReg.email || `${(newReg.fullNameLatin || 'farmer').toLowerCase().replace(/\s/g, '.')}@example.com`,
            kebele: newReg.kebele,
            woreda: newReg.woreda,
            region: newReg.region,
            village: newReg.village || '',
            registeredDate: regDate,
            registrationDateField: regDate,
            acres: `${newReg.landHoldings || 0} Acres`,
            crops: newReg.agricultureType || [],
            registryStatus: 'Pending Validation',
            status: 'Pending Validation',
            kisanCard: 'Active',
            faydaId: newReg.faydaId || newReg.nationalId || '',
            nationalId: newReg.nationalId || newReg.faydaId || '',
            livelihood: newReg.primaryLivelihood || newReg.primaryActivity || 'Mixed',
            verificationStatus: newReg.faydaId || newReg.nationalId ? 'Pending' : 'Unverified',
            notes: newReg.notes || '',
            householdSize: parseInt(newReg.householdSize, 10) || 1,
            deleted: false,
            auditLog: [createAuditEntry({
                type: 'Profile Created', farmerId: idStr, message: 'Farmer registered in OpenAgriNet (demo).',
            }),],
            statusHistory: [{
                at: nowIso(), from: 'Draft', to: 'Pending Validation', reason: 'Submitted', by: 'current-user',
            },],
        };
        const newEntry = normalizeFarmer(raw);
        setFarmers([newEntry, ...farmers]);
        setRegistrationSuccess({id: newEntry.id, name: newEntry.name});
        if (!opts.stayOnSuccess) {
            setActiveTab('list');
            setSearchTerm('');
        }
    };

    const handlePrintAction = () => {
        window.print();
    };

    const handleDownloadAction = (type, farmer) => {
        setExportMessage(`Preparing ${type} for ${farmer.name}...`);
        setTimeout(() => {
            setExportMessage(`${type} has been downloaded successfully.`);
            setTimeout(() => setExportMessage(null), 3000);
        }, 1500);
    };

    const toggleStatusFilter = (status) => {
        if (selectedStatuses.includes(status)) {
            setSelectedStatuses(selectedStatuses.filter(s => s !== status));
        } else {
            setSelectedStatuses([...selectedStatuses, status]);
        }
    };

    const toggleRegionFilter = (region) => {
        if (region === 'All Regions') {
            setSelectedRegions(selectedRegions.includes('All Regions') ? [] : ['All Regions', ...regions]);
        } else {
            const newSelection = selectedRegions.includes(region) ? selectedRegions.filter(r => r !== region && r !== 'All Regions') : [...selectedRegions.filter(r => r !== 'All Regions'), region];
            setSelectedRegions(newSelection.length === regions.length ? ['All Regions', ...newSelection] : newSelection);
        }
    };

    const allWoredas = useMemo(() => distinctWoredas(farmers), [farmers]);

    const toggleWoredaFilter = (w) => {
        if (w === 'All Woredas') {
            setSelectedWoredas(selectedWoredas.includes('All Woredas') ? [] : ['All Woredas', ...allWoredas]);
        } else {
            const next = selectedWoredas.includes(w) ? selectedWoredas.filter((x) => x !== w && x !== 'All Woredas') : [...selectedWoredas.filter((x) => x !== 'All Woredas'), w];
            setSelectedWoredas(next.length === allWoredas.length ? ['All Woredas', ...next] : next);
        }
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setSelectedStatuses([...REGISTRY_STATUSES]);
        setSelectedRegions(['All Regions']);
        setSelectedWoredas(['All Woredas']);
        setCurrentPage(1);
    };

    const filteredFarmersList = farmers.filter((farmer) => {
        if (farmer.deleted) return false;
        const q = searchTerm.toLowerCase();
        const matchesSearch = !q || farmer.name.toLowerCase().includes(q) || (farmer.fullNameLocal || '').toLowerCase().includes(q) || (farmer.fullNameAmharic || '').toLowerCase().includes(q) || farmer.id.toLowerCase().includes(q) || (farmer.kebele || '').toLowerCase().includes(q);
        const st = farmer.registryStatus || farmer.status;
        const matchesStatus = selectedStatuses.includes(st);
        const matchesRegion = selectedRegions.includes('All Regions') || selectedRegions.includes(farmer.region);
        const matchesWoreda = selectedWoredas.includes('All Woredas') || selectedWoredas.includes(farmer.woreda);
        return matchesSearch && matchesStatus && matchesRegion && matchesWoreda;
    });

    const sortedFarmers = [...filteredFarmersList].sort((a, b) => {
        const order = sortConfig.direction === 'asc' ? 1 : -1;
        const {key} = sortConfig;
        if (key === 'name' || key === 'fullNameLatin') return (a.fullNameLatin || a.name).localeCompare(b.fullNameLatin || b.name) * order;
        if (key === 'fullNameLocal') return (a.fullNameLocal || '').localeCompare(b.fullNameLocal || '') * order;
        if (key === 'id') return a.id.localeCompare(b.id) * order;
        if (key === 'registeredDate') return (new Date(a.registeredDate) - new Date(b.registeredDate)) * order;
        if (key === 'kebele') return (a.kebele || '').localeCompare(b.kebele || '') * order;
        if (key === 'woreda') return (a.woreda || '').localeCompare(b.woreda || '') * order;
        if (key === 'region') return (a.region || '').localeCompare(b.region || '') * order;
        if (key === 'gender') return (a.gender || '').localeCompare(b.gender || '') * order;
        if (key === 'ageYears') return ((a.ageYears || 0) - (b.ageYears || 0)) * order;
        if (key === 'registryStatus') return (a.registryStatus || a.status).localeCompare(b.registryStatus || b.status) * order;
        return 0;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentFarmers = sortedFarmers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedFarmers.length / itemsPerPage);

    const handleDocumentUpload = () => {
        if (!docUploadFile || docUploadType === 'Select Type...') return;

        let docUrl = 'https://images.unsplash.com/photo-1586717791821-3f44a563cc4c?auto=format&fit=crop&q=80&w=1470';

        if (selectedFileObj) {
            // Live preview for current session
            docUrl = URL.createObjectURL(selectedFileObj);
        } else {
            // Persistent high-fidelity mockups for all document types
            if (docUploadType === 'National ID') {
                docUrl = 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1074';
            } else if (docUploadType === 'Land Certificate') {
                docUrl = 'https://images.unsplash.com/photo-1621905252507-b35242f31fba?auto=format&fit=crop&q=80&w=1470';
            } else if (docUploadType === 'Family Proof') {
                docUrl = 'https://images.unsplash.com/photo-1600880212319-7524ebd7558e?auto=format&fit=crop&q=80&w=1470';
            } else if (docUploadType === 'Agriculture License') {
                docUrl = 'https://images.unsplash.com/photo-1595113316349-9fa4ee24f884?auto=format&fit=crop&q=80&w=1472';
            }
        }

        const newDoc = {
            id: Date.now(),
            name: docUploadFile,
            type: docUploadType,
            date: new Date().toISOString().split('T')[0],
            size: '1.2 MB',
            url: docUrl
        };

        const updatedFarmer = {
            ...viewingFarmer, documents: [newDoc, ...(viewingFarmer.documents || [])]
        };

        const updatedFarmers = farmers.map(f => f.id === viewingFarmer.id ? updatedFarmer : f);
        setFarmers(updatedFarmers);
        setViewingFarmer(updatedFarmer);
        setDocUploadFile('');
        setSelectedFileObj(null);
        setDocUploadType('Select Type...');
    };

    const handleSelectAll = (e) => {
        setSelectedFarmers(e.target.checked ? currentFarmers.map((f) => f.id) : []);
    };

    const applySelectAllMatching = () => {
        setSelectedFarmers(filteredFarmersList.map((f) => f.id));
        setSelectAllPagesOpen(false);
    };

    const privilegedViewer = userRole === 'Admin' || userRole === 'Super User';

    const handleSelectFarmer = (id) => {
        setSelectedFarmers(selectedFarmers.includes(id) ? selectedFarmers.filter(fid => fid !== id) : [...selectedFarmers, id]);
    };

    const handleDownload = (doc) => {
        if (!doc || !doc.url) return;
        const link = document.createElement('a');
        link.href = doc.url;
        link.download = doc.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const requestSort = (key) => {
        setSortConfig({key, direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'});
    };

    const handleViewFarmer = (id) => {
        const farmerToView = farmers.find(f => f.id === id);
        if (farmerToView) {
            setViewingFarmer(farmerToView);
            setActiveTab('profile');
            setOpenActionMenuId(null);
        }
    };

    const handleEditRegistration = (id) => {
        const farmerToEdit = farmers.find(f => f.id === id);
        if (farmerToEdit) {
            if (farmerToEdit.registryStatus === 'Suspended') {
                window.alert('This profile is suspended. Change status back to Active (or request reactivation) before editing.');
                return;
            }
            setEditingFarmer(farmerToEdit);
            setActiveTab('new');
            setOpenActionMenuId(null);
        }
    };

    const patchFarmerById = (id, updater) => {
        setFarmers((prev) => prev.map((f) => (f.id === id ? updater(f) : f)));
        setViewingFarmer((vf) => (vf && vf.id === id ? updater(vf) : vf));
    };

    const submitStatusUpdate = ({to, reason, notes}) => {
        if (!statusModalFarmer) return;
        const id = statusModalFarmer.id;
        const from = statusModalFarmer.registryStatus || statusModalFarmer.status;
        patchFarmerById(id, (f) => normalizeFarmer({
            ...f,
            registryStatus: to,
            status: to,
            lastUpdatedBy: 'current-user',
            lastUpdatedAt: nowIso(),
            statusHistory: [{
                at: nowIso(),
                from,
                to,
                reason: reason || notes || '—',
                by: 'current-user'
            }, ...(f.statusHistory || []),],
            auditLog: [createAuditEntry({
                type: 'Status Changed',
                farmerId: id,
                message: `Status changed: ${from} → ${to}`,
                before: {status: from},
                after: {status: to},
                justification: reason || notes,
            }), ...(f.auditLog || []),],
        }));
        setStatusModalFarmer(null);
    };

    const submitFaydaVerification = (patch, farmerIdArg) => {
        const id = farmerIdArg || faydaModalFarmer?.id;
        if (!id) return;
        patchFarmerById(id, (f) => {
            const prevReg = f.registryStatus || f.status;
            const nextReg = patch.registryStatus ?? patch.status ?? prevReg;
            const regChanged = nextReg !== prevReg;
            return normalizeFarmer({
                ...f, ...patch,
                lastUpdatedAt: nowIso(),
                lastUpdatedBy: patch.verifiedBy || 'current-user',
                statusHistory: regChanged ? [{
                    at: nowIso(),
                    from: prevReg,
                    to: nextReg,
                    reason: 'Fayda verification succeeded',
                    by: patch.verifiedBy || 'current-user',
                }, ...(f.statusHistory || []),] : f.statusHistory,
                auditLog: [createAuditEntry({
                    type: 'Fayda Verification',
                    farmerId: id,
                    message: 'Registry check: Fayda ID unique in integrated database (mock).',
                    before: {
                        verificationStatus: f.verificationStatus, registryStatus: prevReg,
                    },
                    after: {
                        verificationStatus: patch.verificationStatus,
                        registryStatus: nextReg,
                        verificationDate: patch.verificationDate,
                    },
                }), ...(f.auditLog || []),],
            });
        });
        setFaydaModalFarmer(null);
    };

    const submitSoftDelete = (reason) => {
        if (!deleteModalFarmer) return;
        const id = deleteModalFarmer.id;
        patchFarmerById(id, (f) => normalizeFarmer({
            ...f,
            deleted: true,
            deletedAt: nowIso(),
            deletedBy: 'current-user',
            deleteReason: reason,
            auditLog: [createAuditEntry({
                type: 'Profile Deleted', farmerId: id, message: `Soft delete: ${reason}`, justification: reason,
            }), ...(f.auditLog || []),],
        }));
        setDeleteModalFarmer(null);
        setSelectedFarmers((s) => s.filter((x) => x !== id));
        setViewingFarmer((vf) => {
            if (vf && vf.id === id) {
                setActiveTab('list');
                return null;
            }
            return vf;
        });
    };

    const runBulkAction = ({action, status, region, woreda, reason}) => {
        const ids = new Set(selectedFarmers);
        let success = 0;
        let failed = 0;
        setFarmers((prev) => prev.map((f) => {
            if (!ids.has(f.id) || f.deleted) return f;
            if (action === 'status') {
                const from = f.registryStatus || f.status;
                success++;
                return normalizeFarmer({
                    ...f,
                    registryStatus: status,
                    status,
                    lastUpdatedAt: nowIso(),
                    statusHistory: [{
                        at: nowIso(),
                        from,
                        to: status,
                        reason: reason || 'Bulk',
                        by: 'current-user'
                    }, ...(f.statusHistory || []),],
                    auditLog: [createAuditEntry({
                        type: 'Status Changed',
                        farmerId: f.id,
                        message: 'Bulk status update',
                        before: {status: from},
                        after: {status},
                        justification: reason,
                    }), ...(f.auditLog || []),],
                });
            }
            if (action === 'assign' && region) {
                success++;
                return normalizeFarmer({
                    ...f, region, woreda: woreda || f.woreda, lastUpdatedAt: nowIso(), auditLog: [createAuditEntry({
                        type: 'Profile Updated',
                        farmerId: f.id,
                        message: 'Bulk region/woreda reassignment',
                        after: {region, woreda: woreda || f.woreda},
                        justification: reason,
                    }), ...(f.auditLog || []),],
                });
            }
            if (action === 'verify') {
                const fid = (f.faydaId || f.nationalId || '').trim();
                if (!fid || findFarmerWithFaydaId(prev, fid, f.id)) {
                    failed++;
                    return f;
                }
                success++;
                return normalizeFarmer({
                    ...f,
                    verificationStatus: 'Verified',
                    verificationDate: nowIso().split('T')[0],
                    verifiedBy: 'current-user',
                    auditLog: [createAuditEntry({
                        type: 'Fayda Verification',
                        farmerId: f.id,
                        message: 'Bulk verify — ID unique in registry (mock).',
                    }), ...(f.auditLog || []),],
                });
            }
            if (action === 'delete') {
                success++;
                return normalizeFarmer({
                    ...f,
                    deleted: true,
                    deletedAt: nowIso(),
                    deletedBy: 'current-user',
                    deleteReason: reason || 'Bulk delete',
                    auditLog: [createAuditEntry({
                        type: 'Profile Deleted',
                        farmerId: f.id,
                        message: reason || 'Bulk soft delete',
                        justification: reason,
                    }), ...(f.auditLog || []),],
                });
            }
            return f;
        }));
        setBulkModal(null);
        setSelectedFarmers([]);
        setBulkResultMessage(`Bulk ${action} complete (demo): ${success} updated${failed ? `, ${failed} skipped (Fayda conflict or missing ID)` : ''}.`);
        setTimeout(() => setBulkResultMessage(null), 5000);
    };

    const exportRows = (list) => {
        const rows = list.map((f) => ({
            'Farmer ID': f.id,
            'Full Name (EN)': f.fullNameLatin || f.name,
            'Full Name (Local)': f.fullNameLocal || f.fullNameAmharic || '',
            Gender: f.gender,
            'Age / DOB': f.dob || f.age,
            Kebele: f.kebele,
            Woreda: f.woreda,
            Region: f.region,
            'Registration Date': f.registeredDate,
            Status: f.registryStatus || f.status,
            'Fayda ID': f.faydaId || f.nationalId || '',
        }));
        return rows;
    };

    const handleExportCSV = (subsetIds) => {
        setExportMessage({type: 'info', text: 'Preparing CSV export...'});
        setTimeout(() => {
            try {
                const source = subsetIds && subsetIds.length > 0 ? filteredFarmersList.filter((f) => subsetIds.includes(f.id)) : filteredFarmersList;
                const rows = exportRows(source);
                if (!rows.length) {
                    setExportMessage({type: 'error', text: 'No rows to export.'});
                    setTimeout(() => setExportMessage(null), 2500);
                    return;
                }
                const headers = Object.keys(rows[0] || {});
                const csvData = rows.map((row) => headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','));
                const csvContent = [headers.join(','), ...csvData].join('\n');
                const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                link.setAttribute('href', url);
                link.setAttribute('download', `OAN_Farmer_Registry_${new Date().toISOString().split('T')[0]}.csv`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                setExportMessage({type: 'success', text: 'CSV exported successfully.'});
                setShowDownloadOptions(false);
                setTimeout(() => setExportMessage(null), 3000);
            } catch (err) {
                console.error(err);
                setExportMessage({type: 'error', text: 'CSV export failed'});
                setTimeout(() => setExportMessage(null), 3000);
            }
        }, 400);
    };

    const handleExportExcel = (subsetIds) => {
        try {
            const source = subsetIds && subsetIds.length > 0 ? filteredFarmersList.filter((f) => subsetIds.includes(f.id)) : filteredFarmersList;
            const rows = exportRows(source);
            if (!rows.length) {
                setExportMessage({type: 'error', text: 'No rows to export.'});
                setTimeout(() => setExportMessage(null), 2500);
                return;
            }
            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Farmers');
            XLSX.writeFile(wb, `OAN_Farmer_Registry_${new Date().toISOString().split('T')[0]}.xlsx`);
            setExportMessage({type: 'success', text: 'Excel file downloaded.'});
            setShowDownloadOptions(false);
            setTimeout(() => setExportMessage(null), 3000);
        } catch (e) {
            console.error(e);
            setExportMessage({type: 'error', text: 'Excel export failed'});
            setTimeout(() => setExportMessage(null), 3000);
        }
    };

    const handleAuditExport = (format, entries) => {
        const name = `audit_${auditModalFarmer?.id || 'farmer'}.${format}`;
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(entries, null, 2)], {type: 'application/json'});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = name;
            a.click();
        } else {
            const headers = ['ts', 'type', 'message', 'userId', 'role'];
            const lines = [headers.join(',')].concat(entries.map((e) => headers.map((h) => `"${String(e[h] ?? '').replace(/"/g, '""')}"`).join(',')));
            const blob = new Blob([lines.join('\n')], {type: 'text/csv'});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = name;
            a.click();
        }
    };

    const handleExportPDF = () => {
        setExportMessage({type: 'info', text: 'Generating PDF document...'});
        setTimeout(() => {
            setExportMessage({type: 'success', text: 'PDF Generated and downloaded!'});
            setShowDownloadOptions(false);
            setTimeout(() => setExportMessage(null), 3000);
        }, 1500);
    };

    return (<div className={`dashboard-layout theme-${theme} ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        {exportMessage && (<div className={`export-toast ${exportMessage.type}`}>
            <div className="toast-icon">
                {exportMessage.type === 'info' ? <Activity size={18}/> : exportMessage.type === 'success' ?
                    <Check size={18}/> : <X size={18}/>}
            </div>
            <span>{exportMessage.text}</span>
        </div>)}
        {isSidebarOpen && <div className="sidebar-backdrop" onClick={toggleSidebar}></div>}

        <aside className={`sidebar ${isSidebarOpen ? 'open' : 'collapsed'}`}>
            <div className="sidebar-header">
                <div className="logo-container">
                    <div className="logo-icon"><Sprout size={24} color="#f59e0b"/></div>
                    <div className="logo-text"><h2>OpenAgriNet</h2><span className="logo-subtext">Ethiopia</span>
                    </div>
                </div>
                <button className="sidebar-embedded-toggler" onClick={toggleSidebar}>
                    <Menu size={20} color="white"/>
                </button>
            </div>

            <nav className="sidebar-nav">
                <NavLink to={overviewPath} end className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Home size={20}/>
                    <span>Dashboard</span>
                </NavLink>
                {extraSidebar || <FarmerSidebar/>}
                {extraSidebarFooter}
            </nav>
        </aside>

        <main className="dashboard-main">
            <TopHeader
                userRole={userRole}
                onRoleChange={onRoleChange}
                theme={theme}
                toggleTheme={toggleTheme}
                language={language}
                setLanguage={setLanguage}
                onLogout={onLogout}
                toggleSidebar={toggleSidebar}
            />

            <div className="content-area">
                <PageHeader
                    title="Farmer Registry"
                    subtitle={<>Manage and view <span className="highlight-text">Registered farmers</span> their
                        land holdings, and scheme status.</>}
                    hideDateFilter={true}
                    hideDownload={true}
                    primaryAction={<div className="registry-tabs-v6-wrapper">
                        <div className="registry-tabs-v6">
                            <button
                                className={`registry-tab-v6 ${activeTab === 'list' || activeTab === 'profile' ? 'active' : ''}`}
                                onClick={() => setActiveTab('list')}
                            >
                                Farmer List
                            </button>
                            {/*<button*/}
                            {/*    className={`registry-tab-v6 ${activeTab === 'new' ? 'active' : ''}`}*/}
                            {/*    onClick={() => setActiveTab('new')}*/}
                            {/*>*/}
                            {/*    New Registration*/}
                            {/*</button>*/}
                        </div>
                    </div>}
                />

                {activeTab === 'list' && (<>
                    <div className="stats-grid">
                        <StatCard icon={Users} colorClass="green" value="12,450" label="Total Farmers"
                                  subtext="+12% from last month" growth={{formatted: '+12%', isPositive: true}}
                                  footerIcon={TrendingUp}/>
                        <StatCard icon={ShieldCheck} colorClass="blue" value="11,200" label="Verified Accounts"
                                  subtext="90% of total" growth={{formatted: '90%', isPositive: true}}
                                  footerIcon={CheckCircle}/>
                        <StatCard icon={Clock} colorClass="orange" value="840" label="Pending Approvals"
                                  subtext="Action required" growth={{formatted: '840', isNegative: true}}
                                  footerIcon={Clock}/>
                        <StatCard icon={Wheat} colorClass="purple" value="45,210" label="Total Land (Acres)"
                                  subtext="Across 15 districts" growth={{formatted: '45k', isPositive: true}}
                                  footerIcon={MapPin}/>
                    </div>
                    {/* ── CDC Live Feed Panel ─────────────────────────── */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px'
                    }}>

                        {/* PostgreSQL WAL CDC */}
                        <div className="recent-activities card" style={{padding: '16px'}}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'
                            }}>
                                <div style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: wsConnected ? '#10b981' : '#ef4444',
                                    animation: wsConnected ? 'pulse 2s infinite' : 'none'
                                }}></div>
                                <h3 style={{margin: 0, fontSize: '14px', fontWeight: 600}}>🟢 PostgreSQL WAL
                                    CDC</h3>
                                <span style={{
                                    marginLeft: 'auto',
                                    fontSize: '11px',
                                    color: '#6b7280',
                                    background: '#f3f4f6',
                                    padding: '2px 8px',
                                    borderRadius: '12px'
                                }}>Real-time · ~0ms</span>
                            </div>
                            <div style={{fontSize: '12px', color: '#6b7280', marginBottom: '8px'}}>
                                {wsConnected ? '● Connected' : '○ Reconnecting...'}
                            </div>
                            <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                                {walEvents.length === 0 ? (<div style={{
                                    textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '13px'
                                }}>
                                    Waiting for changes in ati_db...
                                </div>) : walEvents.map(e => (<div key={e.id} style={{
                                    padding: '6px 8px',
                                    marginBottom: '4px',
                                    background: '#f0fdf4',
                                    borderRadius: '6px',
                                    borderLeft: '3px solid #10b981'
                                }}>
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between', fontSize: '12px'
                                    }}>
                                                    <span
                                                        style={{fontWeight: 600, color: '#065f46'}}>{e.operation}</span>
                                        <span
                                            style={{color: '#6b7280'}}>{new Date(e.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <div style={{
                                        fontSize: '11px', color: '#374151', marginTop: '2px'
                                    }}>Table: <code>{e.table}</code></div>
                                </div>))}
                            </div>
                        </div>

                        {/* Airflow CDC */}
                        <div className="recent-activities card" style={{padding: '16px'}}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'
                            }}>
                                <div style={{
                                    width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b'
                                }}></div>
                                <h3 style={{margin: 0, fontSize: '14px', fontWeight: 600}}>🟡 Airflow CDC</h3>
                                <span style={{
                                    marginLeft: 'auto',
                                    fontSize: '11px',
                                    color: '#6b7280',
                                    background: '#f3f4f6',
                                    padding: '2px 8px',
                                    borderRadius: '12px'
                                }}>Batch · Every 1 min</span>
                            </div>
                            <div style={{fontSize: '12px', color: '#6b7280', marginBottom: '8px'}}>
                                Airflow DAG: farmer_airflow_cdc
                            </div>
                            <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                                {airflowEvents.length === 0 ? (<div style={{
                                    textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: '13px'
                                }}>
                                    Waiting for next Airflow run...
                                </div>) : airflowEvents.map(e => (<div key={e.id} style={{
                                    padding: '6px 8px',
                                    marginBottom: '4px',
                                    background: '#fffbeb',
                                    borderRadius: '6px',
                                    borderLeft: '3px solid #f59e0b'
                                }}>
                                    <div style={{
                                        display: 'flex', justifyContent: 'space-between', fontSize: '12px'
                                    }}>
                                                    <span
                                                        style={{fontWeight: 600, color: '#92400e'}}>{e.operation}</span>
                                        <span
                                            style={{color: '#6b7280'}}>{new Date(e.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <div style={{
                                        fontSize: '11px', color: '#374151', marginTop: '2px'
                                    }}>Table: <code>{e.table}</code></div>
                                </div>))}
                            </div>
                        </div>

                    </div>
                    {/* ── End CDC Live Feed Panel ──────────────────────── */}


                    <div ref={registryTableFullscreenRef} className="registry-table-container">
                        <div className="recent-activities card width-card" style={{minHeight: '440px'}}>
                            <div className="card-header-main-v6">
                                <h3 className="card-title-v6"><Users size={18}/> Farmer Registry List</h3>

                                <div className="registry-controls-v6">
                                    <div className="search-wrapper-v6">
                                        <Search size={18} className="search-icon-v6"/>
                                        <input
                                            type="text"
                                            className="search-input-v6"
                                            placeholder="Farmer ID, name (EN / local), kebele…"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        className="registry-clear-filters"
                                        onClick={() => setSelectAllPagesOpen(true)}
                                        title="Select every row matching current filters"
                                    >
                                        Select all matching ({filteredFarmersList.length})
                                    </button>
                                    <button type="button" className="registry-clear-filters"
                                            onClick={clearAllFilters}>
                                        Clear filters
                                    </button>
                                    {/*<button className="add-farmer-btn-v6" onClick={() => setActiveTab('new')}>*/}
                                    {/*    <Plus size={18}/>*/}
                                    {/*    <span>Add Farmer</span>*/}
                                    {/*</button>*/}
                                    {isRegistryTableFullscreen ? (<button
                                        type="button"
                                        className="registry-fullscreen-btn-v6"
                                        onClick={exitRegistryTableFullscreen}
                                        title="Exit full screen (Esc)"
                                    >
                                        <Minimize2 size={18}/>
                                        <span>Exit full screen</span>
                                    </button>) : (<button
                                        type="button"
                                        className="registry-fullscreen-btn-v6"
                                        onClick={enterRegistryTableFullscreen}
                                        title="Expand table to full screen"
                                    >
                                        <Maximize2 size={18}/>
                                        <span>Full screen</span>
                                    </button>)}
                                    <div className="card-download-wrapper-v6" ref={downloadMenuRef}>
                                        <button
                                            type="button"
                                            className="download-btn-card-v6"
                                            onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                                        >
                                            <Download size={18}/>
                                            <span>Export</span>
                                            <ChevronDown size={14}
                                                         className={showDownloadOptions ? 'rotated' : ''}/>
                                        </button>
                                        {showDownloadOptions && (<div className="download-dropdown-card-v6">
                                            <button
                                                type="button"
                                                className="download-item-card-v6"
                                                onClick={() => handleExportCSV(selectedFarmers.length ? selectedFarmers : null)}
                                            >
                                                <FileSpreadsheet size={16} color="#10b981"/>
                                                <span>CSV {selectedFarmers.length ? '(selected)' : '(filtered)'}</span>
                                            </button>
                                            <button
                                                type="button"
                                                className="download-item-card-v6"
                                                onClick={() => handleExportExcel(selectedFarmers.length ? selectedFarmers : null)}
                                            >
                                                <FileSpreadsheet size={16} color="#2563eb"/>
                                                <span>Excel {selectedFarmers.length ? '(selected)' : '(filtered)'}</span>
                                            </button>
                                            <button type="button" className="download-item-card-v6"
                                                    onClick={handleExportPDF}>
                                                <FileText size={16} color="#ef4444"/>
                                                <span>Summary PDF (demo)</span>
                                            </button>
                                        </div>)}
                                    </div>
                                </div>
                            </div>

                            {selectedFarmers.length > 0 && (<div className="registry-bulk-bar">
                                <span>{selectedFarmers.length} selected</span>
                                <div className="registry-bulk-actions">
                                    <button type="button" className="registry-chip-btn"
                                            onClick={() => setBulkModal('status')}>
                                        Bulk update status
                                    </button>
                                    <button type="button" className="registry-chip-btn"
                                            onClick={() => setBulkModal('assign')}>
                                        Assign region / woreda
                                    </button>
                                    <button type="button" className="registry-chip-btn"
                                            onClick={() => setBulkModal('verify')}>
                                        Bulk verify (Fayda ID)
                                    </button>
                                    <button type="button" className="registry-chip-btn"
                                            onClick={() => handleExportCSV(selectedFarmers)}>
                                        Export selected CSV
                                    </button>
                                    <button type="button" className="registry-chip-btn"
                                            onClick={() => handleExportExcel(selectedFarmers)}>
                                        Export selected Excel
                                    </button>
                                    {(userRole === 'Admin' || userRole === 'Super User') && (
                                        <button type="button" className="registry-chip-btn danger"
                                                onClick={() => setBulkModal('delete')}>
                                            Soft delete selected
                                        </button>)}
                                    <button type="button" className="registry-chip-btn"
                                            onClick={() => setSelectedFarmers([])}>
                                        Clear selection
                                    </button>
                                </div>
                            </div>)}

                            <div className="table-responsive" style={{marginTop: '0px'}}>
                                <table className="registry-table registry-list-table registry-table-spec">
                                    <thead>
                                    <tr>
                                        <th className="checkbox-col">
                                            <div className="header-cell-checkbox">
                                                <input
                                                    type="checkbox"
                                                    className="modern-checkbox-s"
                                                    onChange={handleSelectAll}
                                                    checked={currentFarmers.length > 0 && currentFarmers.every((f) => selectedFarmers.includes(f.id))}
                                                />
                                            </div>
                                        </th>
                                        <th onClick={() => requestSort('fullNameLatin')}
                                            className="details-col sortable-col">
                                            <div className="header-cell-standard">Farmer</div>
                                        </th>
                                        <th onClick={() => requestSort('kebele')} className="sortable-col">
                                            <div className="header-cell-standard">Kebele</div>
                                        </th>
                                        <th className="woreda-col">
                                            <div className="header-cell-standard header-with-filtered-icon">
                                                            <span onClick={() => requestSort('woreda')}
                                                                  className="sortable-col" role="button">
                                                                Woreda
                                                            </span>
                                                <div className="status-filter-trigger-wrapper"
                                                     ref={woredaFilterRef}>
                                                    <button
                                                        type="button"
                                                        className="filter-trigger-icon-bt"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setWoredaFilterOpen(!woredaFilterOpen);
                                                        }}
                                                    >
                                                        <Filter size={13}/>
                                                    </button>
                                                    {woredaFilterOpen && (<div
                                                        className="status-filter-dropdown prestige-dropdown region-scroll-dropdown">
                                                        <div className="filter-dropdown-title">Filter
                                                            Woreda
                                                        </div>
                                                        <div className="filter-options-list">
                                                            <label className="filter-option-item">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedWoredas.includes('All Woredas')}
                                                                    onChange={() => toggleWoredaFilter('All Woredas')}
                                                                />
                                                                <span className="filter-status-text">All Woredas</span>
                                                            </label>
                                                            {allWoredas.map((w) => (<label key={w}
                                                                                           className="filter-option-item">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedWoredas.includes(w)}
                                                                    onChange={() => toggleWoredaFilter(w)}
                                                                />
                                                                <span
                                                                    className="filter-status-text">{w}</span>
                                                            </label>))}
                                                        </div>
                                                    </div>)}
                                                </div>
                                            </div>
                                        </th>
                                        <th className="region-col">
                                            <div className="header-cell-standard header-with-filtered-icon">
                                                            <span onClick={() => requestSort('region')}
                                                                  className="sortable-col" role="button">
                                                                Region
                                                            </span>
                                                <div className="status-filter-trigger-wrapper"
                                                     ref={regionFilterRef}>
                                                    <button
                                                        type="button"
                                                        className="filter-trigger-icon-bt"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setRegionFilterOpen(!regionFilterOpen);
                                                        }}
                                                    >
                                                        <Filter size={13}/>
                                                    </button>
                                                    {regionFilterOpen && (<div
                                                        className="status-filter-dropdown prestige-dropdown region-scroll-dropdown">
                                                        <div className="filter-dropdown-title">Filter
                                                            Region
                                                        </div>
                                                        <div className="filter-options-list">
                                                            <label className="filter-option-item">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedRegions.includes('All Regions')}
                                                                    onChange={() => toggleRegionFilter('All Regions')}
                                                                />
                                                                <span className="filter-status-text">All Regions</span>
                                                            </label>
                                                            {regions.map((region) => (<label key={region}
                                                                                             className="filter-option-item">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedRegions.includes(region)}
                                                                    onChange={() => toggleRegionFilter(region)}
                                                                />
                                                                <span
                                                                    className="filter-status-text">{region}</span>
                                                            </label>))}
                                                        </div>
                                                    </div>)}
                                                </div>
                                            </div>
                                        </th>
                                        <th onClick={() => requestSort('gender')} className="sortable-col">
                                            <div className="header-cell-standard">Gender</div>
                                        </th>
                                        <th onClick={() => requestSort('ageYears')} className="sortable-col">
                                            <div className="header-cell-standard">Age / DOB</div>
                                        </th>
                                        <th onClick={() => requestSort('registeredDate')}
                                            className="sortable-col">
                                            <div className="header-cell-standard">Reg. date</div>
                                        </th>
                                        <th className="status-col">
                                            <div className="header-cell-standard header-with-filtered-icon">
                                                <span>Status</span>
                                                <div className="status-filter-trigger-wrapper"
                                                     ref={statusFilterRef}>
                                                    <button
                                                        type="button"
                                                        className="filter-trigger-icon-bt"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setStatusFilterOpen(!statusFilterOpen);
                                                        }}
                                                    >
                                                        <Filter size={13}/>
                                                    </button>
                                                    {statusFilterOpen && (<div
                                                        className="status-filter-dropdown prestige-dropdown">
                                                        <div className="filter-dropdown-title">Filter
                                                            Status
                                                        </div>
                                                        <div className="filter-options-list">
                                                            {REGISTRY_STATUSES.map((status) => (
                                                                <label key={status}
                                                                       className="filter-option-item">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={selectedStatuses.includes(status)}
                                                                        onChange={() => toggleStatusFilter(status)}
                                                                    />
                                                                    <span
                                                                        className="filter-status-text">{status}</span>
                                                                </label>))}
                                                        </div>
                                                    </div>)}
                                                </div>
                                            </div>
                                        </th>
                                        <th className="actions-col">Actions</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {currentFarmers.length > 0 ? (currentFarmers.map((farmer) => {
                                        const st = farmer.registryStatus || farmer.status;
                                        return (<tr
                                            key={farmer.id}
                                            className={[selectedFarmers.includes(farmer.id) ? 'selected-row' : '', openActionMenuId === farmer.id ? 'registry-row-actions-open' : '',]
                                                .filter(Boolean)
                                                .join(' ')}
                                        >
                                            <td className="checkbox-col" data-label="Select">
                                                <div className="td-cell-checkbox">
                                                    <input
                                                        type="checkbox"
                                                        className="modern-checkbox-s"
                                                        checked={selectedFarmers.includes(farmer.id)}
                                                        onChange={() => handleSelectFarmer(farmer.id)}
                                                    />
                                                </div>
                                            </td>
                                            <td className="details-col" data-label="Farmer">
                                                <div className="farmer-details-vertical-stack">
                                                    <img
                                                        src={farmer.photo}
                                                        alt=""
                                                        className="farmer-stack-avatar-top"
                                                    />
                                                    <div className="farmer-info-content-v2">
                                                        <div className="farmer-main-name-top">
                                                            {farmer.fullNameLatin || farmer.name}
                                                        </div>
                                                        <div className="farmer-local-name-sub">
                                                            {farmer.fullNameLocal || farmer.fullNameAmharic || '—'}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            className="farmer-id-chip-btn"
                                                            onClick={() => handleViewFarmer(farmer.id)}
                                                        >
                                                            {farmer.id}
                                                        </button>
                                                        <div className="farmer-meta-stack">
                                                            <div className="farmer-meta-item">
                                                                <Mail size={14}
                                                                      className="meta-icon-v3"/>
                                                                <span>{farmer.email}</span>
                                                            </div>
                                                            <div className="farmer-meta-item">
                                                                <Phone size={14}
                                                                       className="meta-icon-v3"/>
                                                                <span>{farmer.phone}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="kebele-col" data-label="Kebele">
                                                {farmer.kebele}
                                            </td>
                                            <td className="woreda-col" data-label="Woreda">
                                                {farmer.woreda}
                                            </td>
                                            <td className="region-col" data-label="Region">
                                                {farmer.region}
                                            </td>
                                            <td data-label="Gender">{farmer.gender}</td>
                                            <td data-label="Age">{farmer.dob ? `${farmer.age} / ${farmer.dob}` : farmer.age}</td>
                                            <td data-label="Registered">{farmer.registeredDate}</td>
                                            <td className="status-col" data-label="Status">
                                                <div
                                                    className={`status-pill-v4 ${statusCssClass(st)}`}>{st}</div>
                                            </td>
                                            <td className="actions-col" data-label="Actions">
                                                <button
                                                    type="button"
                                                    className="dots-trigger-v5"
                                                    onClick={() => setOpenActionMenuId(openActionMenuId === farmer.id ? null : farmer.id)}
                                                >
                                                    <MoreVertical size={18}/>
                                                </button>
                                                {openActionMenuId === farmer.id && (
                                                    <div className="action-popup-v5">
                                                        <button
                                                            type="button"
                                                            className="action-item-v5"
                                                            onClick={() => handleViewFarmer(farmer.id)}
                                                        >
                                                            <Eye size={16}/> View
                                                        </button>
                                                    </div>)}
                                            </td>
                                        </tr>);
                                    })) : (<tr>
                                        <td colSpan={10}>
                                            <div className="empty-state-container">
                                                <div className="empty-icon-v5">
                                                    <Search size={32}/>
                                                </div>
                                                <h4 className="empty-title-v5">No Farmers Found</h4>
                                                <p className="empty-subtitle-v5">
                                                    We couldn&apos;t find any farmers matching your current
                                                    filters or search query.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>)}
                                    </tbody>
                                </table>
                            </div>

                            {sortedFarmers.length > 0 && (<div className="registry-footer-v5">
                                <div className="footer-stats-v5">Showing <span
                                    className="highlight-v5">{indexOfFirstItem + 1}</span> to <span
                                    className="highlight-v5">{Math.min(indexOfLastItem, sortedFarmers.length)}</span> of <span
                                    className="highlight-v5">{sortedFarmers.length}</span> farmers
                                </div>
                                <div className="registry-page-size">
                                    <span>Rows per page</span>
                                    <select
                                        value={itemsPerPage}
                                        onChange={(e) => {
                                            setItemsPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                    >
                                        {[10, 25, 50, 100].map((n) => (<option key={n} value={n}>
                                            {n}
                                        </option>))}
                                    </select>
                                </div>
                                <div className="pagination-controls-v5">
                                    <button className="pagination-btn-v5" disabled={currentPage === 1}
                                            onClick={() => setCurrentPage(currentPage - 1)}>Prev
                                    </button>
                                    <div className="pagination-pages-v5">
                                        {Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
                                            <button key={page}
                                                    className={`page-num-v5 ${currentPage === page ? 'active' : ''}`}
                                                    onClick={() => setCurrentPage(page)}>{page}</button>))}
                                    </div>
                                    <button className="pagination-btn-v5"
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage(currentPage + 1)}>Next
                                    </button>
                                </div>
                            </div>)}
                        </div>
                    </div>
                </>)}

                {activeTab === 'new' && (<FarmerRegistrationForm
                    initialData={editingFarmer}
                    existingFarmers={farmers}
                    onCancel={() => {
                        setEditingFarmer(null);
                        if (viewingFarmer) {
                            setActiveTab('profile');
                        } else {
                            setActiveTab('list');
                        }
                    }}
                    onComplete={(data) => {
                        handleNewRegistration(data);
                        setEditingFarmer(null);
                    }}
                />)}

                {activeTab === 'profile' && viewingFarmer && (
                    <div className="farmer-profile-container-v6 animation-fadeIn" key={viewingFarmer.id}>
                        <div
                            className="back-navigator-v6"
                            onClick={() => {
                                setActiveTab('list');
                                setViewingFarmer(null);
                            }}
                        >
                            <ArrowLeft size={18}/>
                            <span>Back</span>
                        </div>

                        {/* Profile Header Card */}
                        <div className="profile-header-card-v6">
                            <div className="profile-header-top-v6">
                                <div className="profile-main-info-v6">
                                    <div className="profile-avatar-wrapper-v6">
                                        <img src={viewingFarmer.photo} alt={viewingFarmer.name}
                                             className="profile-avatar-v6"/>
                                    </div>
                                    <div className="profile-text-content-v6">
                                        <h2 className="profile-name-v6">{viewingFarmer.name}</h2>
                                        <div
                                            className="profile-subname-v6">{viewingFarmer.fullNameLocal || viewingFarmer.fullNameAmharic || '—'}</div>
                                        <div className="profile-badges-v6">
                                            <span className="profile-id-badge-v6">{viewingFarmer.id}</span>
                                            <span
                                                className={`status-pill-v4 ${statusCssClass(viewingFarmer.registryStatus || viewingFarmer.status)}`}>{viewingFarmer.registryStatus || viewingFarmer.status}</span>
                                            <span className="biometric-badge-v6">
                                                    Fayda: {viewingFarmer.verificationStatus || 'Unverified'}
                                                {viewingFarmer.verificationDate ? ` · ${viewingFarmer.verificationDate}` : ''}
                                                </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="profile-header-actions-v6">
                                    <button className="profile-action-btn-v6"
                                            onClick={() => setShowRecordPreview(true)}><Eye size={16}/> Full Record
                                        Preview
                                    </button>
                                    {/*<button className="profile-action-btn-v6"*/}
                                    {/*        onClick={() => handleEditRegistration(viewingFarmer.id)}><Edit*/}
                                    {/*    size={16}/> Edit*/}
                                    {/*</button>*/}
                                    {/*<button type="button" className="profile-action-btn-v6"*/}
                                    {/*        onClick={() => setStatusModalFarmer(viewingFarmer)}><ClipboardCheck*/}
                                    {/*    size={16}/> Update status*/}
                                    {/*</button>*/}
                                    {/*<button type="button" className="profile-action-btn-v6"*/}
                                    {/*        onClick={() => setFaydaModalFarmer(viewingFarmer)}><ShieldCheck*/}
                                    {/*    size={16}/> Verify (Fayda)*/}
                                    {/*</button>*/}
                                    {/*<button type="button" className="profile-action-btn-v6"*/}
                                    {/*        onClick={() => setAuditModalFarmer(viewingFarmer)}><History*/}
                                    {/*    size={16}/> Audit log*/}
                                    {/*</button>*/}
                                    {/*<button className="profile-action-btn-v6"*/}
                                    {/*        onClick={() => setShowIdPreview(true)}><Printer size={16}/> Print ID*/}
                                    {/*</button>*/}
                                </div>
                            </div>

                            <div className="profile-header-stats-v6">
                                <div className="header-stat-item-v6">
                                    <MapPin size={18} className="stat-icon-v6"/>
                                    <div className="stat-details-v6">
                                        <span className="stat-label-v6">Location</span>
                                        <span
                                            className="stat-value-v6">{viewingFarmer.kebele}, {viewingFarmer.region}</span>
                                    </div>
                                </div>
                                <div className="header-stat-item-v6">
                                    <Calendar size={18} className="stat-icon-v6"/>
                                    <div className="stat-details-v6">
                                        <span className="stat-label-v6">Registered</span>
                                        <span className="stat-value-v6">{viewingFarmer.registeredDate}</span>
                                    </div>
                                </div>
                                <div className="header-stat-item-v6">
                                    <Phone size={18} className="stat-icon-v6"/>
                                    <div className="stat-details-v6">
                                        <span className="stat-label-v6">Phone</span>
                                        <span className="stat-value-v6">{viewingFarmer.phone}</span>
                                    </div>
                                </div>
                                <div className="header-stat-item-v6">
                                    <Users size={18} className="stat-icon-v6"/>
                                    <div className="stat-details-v6">
                                        <span className="stat-label-v6">Household</span>
                                        <span
                                            className="stat-value-v6">{viewingFarmer.householdSize || 6} members</span>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Main Content Layout */}
                        <div className="profile-layout-v6">
                            <div className="profile-main-pane-v6">
                                {/* Tab Switcher Integrated with Content to match width */}
                                <div className="profile-tab-switcher-v6">
                                    {['Personal Info', 'Household & Farming Profile', 'Documents', 'Related records', 'Status history', 'Audit log'].map(tab => (
                                        <button
                                            key={tab}
                                            className={`profile-tab-btn-v6 ${activeProfileTab === tab ? 'active' : ''}`}
                                            onClick={() => setActiveProfileTab(tab)}
                                        >
                                            {tab}
                                        </button>))}
                                </div>

                                <div className="pane-card-v6">
                                    {activeProfileTab === 'Personal Info' && (<>
                                        <div className="profile-section-v6">
                                            <h3 className="pane-card-title-v6">Personal Information</h3>
                                            <div className="profile-data-grid-v6">
                                                <div className="data-item-v6"><span className="data-label-v6">Full Name (Amharic)</span><span
                                                    className="data-value-v6">{viewingFarmer.fullNameAmharic || "—"}</span>
                                                </div>
                                                <div className="data-item-v6"><span className="data-label-v6">Full Name (Latin)</span><span
                                                    className="data-value-v6">{viewingFarmer.name || "—"}</span>
                                                </div>
                                                <div className="data-item-v6"><span
                                                    className="data-label-v6">Gender</span><span
                                                    className="data-value-v6">{viewingFarmer.gender || "—"}</span>
                                                </div>
                                                <div className="data-item-v6"><span className="data-label-v6">Date of Birth</span><span
                                                    className="data-value-v6">{viewingFarmer.dob || viewingFarmer.dateOfBirth || "—"}</span>
                                                </div>
                                                <div className="data-item-v6"><span
                                                    className="data-label-v6">Age</span><span
                                                    className="data-value-v6">{viewingFarmer.age || "—"}</span>
                                                </div>
                                                <div className="data-item-v6"><span className="data-label-v6">Primary Mobile</span><span
                                                    className="data-value-v6">{viewingFarmer.phone || viewingFarmer.mobileNumber || "—"}</span>
                                                </div>
                                                <div className="data-item-v6"><span className="data-label-v6">Secondary Mobile</span><span
                                                    className="data-value-v6">{viewingFarmer.alternateMobileNumber || "—"}</span>
                                                </div>
                                                <div className="data-item-v6"><span className="data-label-v6">Email Address</span><span
                                                    className="data-value-v6">{viewingFarmer.email || "—"}</span>
                                                </div>
                                                <div className="data-item-v6"><span className="data-label-v6">Social Media</span><span
                                                    className="data-value-v6">{viewingFarmer.socialMediaLink || "—"}</span>
                                                </div>
                                                <div className="data-item-v6"><span className="data-label-v6">Fayda ID (masked)</span><span
                                                    className="data-value-v6">{maskFaydaId(viewingFarmer.faydaId || viewingFarmer.nationalId, privilegedViewer)}</span>
                                                </div>
                                                <div className="data-item-v6"><span
                                                    className="data-label-v6">Verification</span><span
                                                    className="data-value-v6">{viewingFarmer.verificationStatus || '—'} {viewingFarmer.verifiedBy ? `· by ${viewingFarmer.verifiedBy}` : ''}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="profile-section-v6 mt-32">
                                            <h3 className="pane-card-title-v6">System metadata</h3>
                                            <div className="profile-data-grid-v6">
                                                <div className="data-item-v6"><span className="data-label-v6">Source system</span><span
                                                    className="data-value-v6">{viewingFarmer.sourceSystem || '—'}</span>
                                                </div>
                                                <div className="data-item-v6"><span
                                                    className="data-label-v6">Source ID</span><span
                                                    className="data-value-v6">{viewingFarmer.sourceId || '—'}</span>
                                                </div>
                                                <div className="data-item-v6"><span
                                                    className="data-label-v6">Created by</span><span
                                                    className="data-value-v6">{viewingFarmer.createdBy || '—'}</span>
                                                </div>
                                                <div className="data-item-v6"><span
                                                    className="data-label-v6">Created at</span><span
                                                    className="data-value-v6">{viewingFarmer.createdAt || '—'}</span>
                                                </div>
                                                <div className="data-item-v6"><span className="data-label-v6">Last updated by</span><span
                                                    className="data-value-v6">{viewingFarmer.lastUpdatedBy || '—'}</span>
                                                </div>
                                                <div className="data-item-v6"><span className="data-label-v6">Last updated at</span><span
                                                    className="data-value-v6">{viewingFarmer.lastUpdatedAt || '—'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="profile-section-v6 mt-32">
                                            <h3 className="pane-card-title-v6">Location Information</h3>
                                            <div className="profile-data-grid-v6">
                                                <div className="data-item-v6"><span
                                                    className="data-label-v6">Region</span><span
                                                    className="data-value-v6">{viewingFarmer.region || "—"}</span>
                                                </div>
                                                <div className="data-item-v6"><span
                                                    className="data-label-v6">Woreda</span><span
                                                    className="data-value-v6">{viewingFarmer.woreda || "—"}</span>
                                                </div>
                                                <div className="data-item-v6"><span
                                                    className="data-label-v6">Kebele</span><span
                                                    className="data-value-v6">{viewingFarmer.kebele || "—"}</span>
                                                </div>
                                                <div className="data-item-v6"><span
                                                    className="data-label-v6">Village</span><span
                                                    className="data-value-v6">{viewingFarmer.village || "—"}</span>
                                                </div>
                                                <div className="data-item-v6"><span className="data-label-v6">GPS Coordinates</span><span
                                                    className="data-value-v6">{viewingFarmer.latitude && viewingFarmer.longitude ? `${viewingFarmer.latitude}, ${viewingFarmer.longitude}` : "—"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>)}

                                    {activeProfileTab === 'Household & Farming Profile' && (<>
                                        <div className="profile-section-v6">
                                            <h3 className="pane-card-title-v6">Household & Registration
                                                Status</h3>
                                            <div className="profile-data-grid-v6">
                                                <div className="data-item-v6"><span className="data-label-v6">Head of Household</span><span
                                                    className="data-value-v6">{viewingFarmer.headOfHousehold ? "Yes (Head)" : "No"}</span>
                                                </div>
                                                <div className="data-item-v6"><span className="data-label-v6">Household Size</span><span
                                                    className="data-value-v6">{viewingFarmer.familyMembers || viewingFarmer.householdSize || "6 members"}</span>
                                                </div>
                                                <div className="data-item-v6"><span className="data-label-v6">Farmer Card Status</span><span
                                                    className="data-value-v6"><span
                                                    className={`status-badge-v6 ${viewingFarmer.status?.toLowerCase() === 'active' ? 'verified' : 'pending'}`}>{viewingFarmer.farmerCardStatus || "Active"}</span></span>
                                                </div>
                                                <div className="data-item-v6"><span className="data-label-v6">Registration Status</span><span
                                                    className="data-value-v6"><span
                                                    className={`status-badge-v6 ${viewingFarmer.status?.toLowerCase() === 'verified' ? 'verified' : 'pending'}`}>{viewingFarmer.status || "Pending"}</span></span>
                                                </div>
                                                <div className="data-item-v6"><span className="data-label-v6">Dwelling Type</span><span
                                                    className="data-value-v6">{viewingFarmer.housing_type || '—'}</span>
                                                </div>
                                                <div className="data-item-v6"><span className="data-label-v6">Mobile Ownership</span><span
                                                    className="data-value-v6">{viewingFarmer.has_personal_phone || '—'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="profile-section-v6 mt-32">
                                            <h3 className="pane-card-title-v6">Farming Profile & Economics</h3>
                                            <div className="profile-data-grid-v6">
                                                <div className="data-item-v6"><span className="data-label-v6">Primary Farming Activity</span><span
                                                    className="data-value-v6">{viewingFarmer.farming_type || '—'}</span>
                                                </div>
                                                <div className="data-item-v6"><span className="data-label-v6">Total Agri (Acres)</span><span
                                                    className="data-value-v6">{viewingFarmer.landHoldings || viewingFarmer.acres || "3.5"}</span>
                                                </div>
                                                <div className="data-item-v6"><span className="data-label-v6">Annual Income Value</span><span
                                                    className="data-value-v6">{viewingFarmer.annual_income || (viewingFarmer.income > 0 ? `${viewingFarmer.income} ETB` : '—')}</span>
                                                </div>
                                                <div className="data-item-v6"><span className="data-label-v6">Distance to Market</span><span
                                                    className="data-value-v6">{'—'}</span>
                                                </div>

                                                <div className="data-item-v6 full-width-v6 mt-8">
                                                            <span
                                                                className="data-label-v6">Cooperative Membership</span>
                                                    <div className="tag-cloud-v6 mt-8">
                                                        {(viewingFarmer.cooperatives && viewingFarmer.cooperatives.length > 0 ? viewingFarmer.cooperatives : (viewingFarmer.primary_cooperatives ? [viewingFarmer.primary_cooperatives] : [])).map(c => (
                                                            <span key={c} className="tag-item-v6">{c}</span>))}
                                                    </div>
                                                </div>

                                                <div className="data-item-v6 full-width-v6 mt-8">
                                                    <span className="data-label-v6">Agriculture Type</span>
                                                    <div className="tag-cloud-v6 mt-8">
                                                        {(viewingFarmer.agricultureType && viewingFarmer.agricultureType.length > 0 ? viewingFarmer.agricultureType : (viewingFarmer.primary_commodity ? [viewingFarmer.primary_commodity] : [])).map(c => (
                                                            <span key={c}
                                                                  className="tag-item-v6 secondary">{c}</span>))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>)}

                                    {activeProfileTab === 'Documents' && (<>
                                        <div className="doc-header-v6">
                                            <h3 className="pane-card-title-v6 no-margin">Uploaded Documents</h3>
                                            <div className="doc-upload-controls-v6">
                                                <div className="custom-doc-select-v6"
                                                     style={{position: 'relative'}}>
                                                    <div
                                                        className={`doc-type-trigger-v6 ${isDocTypeOpen ? 'open' : ''}`}
                                                        onClick={() => setIsDocTypeOpen(!isDocTypeOpen)}
                                                    >
                                                        <span>{docUploadType}</span>
                                                        <ChevronDown size={16}
                                                                     className={`chevron-v6 ${isDocTypeOpen ? 'open' : ''}`}/>
                                                    </div>
                                                    {isDocTypeOpen && (
                                                        <div className="doc-type-list-v6 animation-fadeInUp-v6">
                                                            {['National ID', 'Land Certificate', 'Family Proof', 'Agriculture License'].map(type => (
                                                                <div
                                                                    key={type}
                                                                    className="doc-type-item-v6"
                                                                    onClick={() => {
                                                                        setDocUploadType(type);
                                                                        setIsDocTypeOpen(false);
                                                                    }}
                                                                >
                                                                    {type}
                                                                </div>))}
                                                        </div>)}
                                                </div>

                                                <div className="upload-composite-v6">
                                                    <input
                                                        type="file"
                                                        ref={fileInputRef}
                                                        style={{display: 'none'}}
                                                        onChange={(e) => {
                                                            if (e.target.files && e.target.files[0]) {
                                                                setDocUploadFile(e.target.files[0].name);
                                                                setSelectedFileObj(e.target.files[0]);
                                                            }
                                                        }}
                                                    />
                                                    <div className="composite-input-v6"
                                                         onClick={() => fileInputRef.current?.click()}>
                                                        <Upload size={14}
                                                                style={{marginRight: '10px', opacity: 0.6}}/>
                                                        <span style={{
                                                            color: docUploadFile ? '#1e293b' : '#64748b',
                                                            fontSize: '14px',
                                                            fontWeight: docUploadFile ? '600' : '400'
                                                        }}>
                                                                    {docUploadFile || "Choose photo..."}
                                                                </span>
                                                    </div>
                                                </div>

                                                <button
                                                    className="doc-submit-btn-v6"
                                                    onClick={handleDocumentUpload}
                                                    disabled={!docUploadFile || docUploadType === 'Select Type...'}
                                                >
                                                    Submit
                                                </button>
                                            </div>
                                        </div>

                                        <div className="document-list-v6">
                                            {(viewingFarmer.documents || []).map(doc => (<div className="doc-item-v6" key={doc.id}>
                                                {doc.type === 'National ID' ?
                                                    <FileText size={20} className="doc-icon-v6"/> :
                                                    <Layout size={20} className="doc-icon-v6"/>}
                                                <div className="doc-info-v6">
                                                    <span className="doc-name-v6">{doc.name}</span>
                                                    <span
                                                        className="doc-meta-v6">Uploaded on: {doc.date} • {doc.size}</span>
                                                </div>
                                                <div className="doc-actions-v6 horizontal">
                                                    <button
                                                        className="doc-action-btn-v6 view-text"
                                                        onClick={() => setViewingDocument(doc)}
                                                    >
                                                        <Eye size={16}/>
                                                    </button>
                                                    <button
                                                        className="doc-action-btn-v6 download-text"
                                                        onClick={() => handleDownload(doc)}
                                                    >
                                                        <Download size={16}/>
                                                    </button>
                                                    <button
                                                        className="doc-action-btn-v6 delete-text"
                                                        onClick={() => {
                                                            const updatedDocs = (viewingFarmer.documents || []).filter(d => d.id !== doc.id);
                                                            const updatedFarmer = {
                                                                ...viewingFarmer, documents: updatedDocs
                                                            };
                                                            const updatedFarmers = farmers.map(f => f.id === viewingFarmer.id ? updatedFarmer : f);
                                                            setFarmers(updatedFarmers);
                                                            setViewingFarmer(updatedFarmer);
                                                        }}
                                                    >
                                                        <Trash2 size={16}/>
                                                    </button>
                                                </div>
                                            </div>))}
                                        </div>
                                    </>)}

                                    {activeProfileTab === 'Related records' && (<>
                                        <h3 className="pane-card-title-v6">Related records (illustrative)</h3>
                                        <p className="registry-muted" style={{marginBottom: 16}}>
                                            Linked livestock, land parcels, benefits, and transactions will load
                                            from integrated registries.
                                        </p>
                                        <div className="profile-section-v6">
                                            <h4 className="pane-card-title-v6">Livestock</h4>
                                            <table className="registry-mini-table">
                                                <thead>
                                                <tr>
                                                    <th>Tag</th>
                                                    <th>Species</th>
                                                    <th>Status</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                <tr>
                                                    <td colSpan={3}
                                                        style={{textAlign: 'center', color: '#9ca3af'}}>Livestock data
                                                        will load from integrated registry
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="profile-section-v6 mt-24">
                                            <h4 className="pane-card-title-v6">Land parcels</h4>
                                            <table className="registry-mini-table">
                                                <thead>
                                                <tr>
                                                    <th>Parcel ID</th>
                                                    <th>Size (ha)</th>
                                                    <th>Use</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                <tr>
                                                    <td colSpan={3} style={{textAlign: 'center', color: '#9ca3af'}}>Land
                                                        parcel data will load from integrated registry
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="profile-section-v6 mt-24">
                                            <h4 className="pane-card-title-v6">Benefits / schemes</h4>
                                            <ul className="registry-bullet-list">
                                                <li>{viewingFarmer.is_psnp_user ? 'PSNP — enrolled' : 'PSNP — not enrolled'}</li>
                                            </ul>
                                        </div>
                                        <div className="profile-section-v6 mt-24">
                                            <h4 className="pane-card-title-v6">Transaction history</h4>
                                            <table className="registry-mini-table">
                                                <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Type</th>
                                                    <th>Amount</th>
                                                </tr>
                                                </thead>
                                                <tbody>
                                                <tr>
                                                    <td colSpan={3}
                                                        style={{textAlign: 'center', color: '#9ca3af'}}>Transaction data
                                                        will load from Finance Portal
                                                    </td>
                                                </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </>)}

                                    {activeProfileTab === 'Status history' && (<>
                                        <h3 className="pane-card-title-v6">Status history</h3>
                                        <div className="timeline-v6">
                                            {(viewingFarmer.statusHistory || []).map((h, idx) => (
                                                <div className="timeline-item-v6" key={`${h.at}-${idx}`}>
                                                    <div className="timeline-dot-v6"></div>
                                                    <div className="timeline-content-v6">
                                                        <span className="timeline-date-v6">{h.at}</span>
                                                        <span
                                                            className="timeline-title-v6">{h.from} → {h.to}</span>
                                                        <span
                                                            className="timeline-desc-v6">{h.reason} · {h.by}</span>
                                                    </div>
                                                </div>))}
                                        </div>
                                    </>)}

                                    {activeProfileTab === 'Audit log' && (<>
                                        <h3 className="pane-card-title-v6">Audit log (read-only)</h3>
                                        <p className="registry-muted">Use Export in the modal for CSV/JSON with
                                            filters. Entries are immutable.</p>
                                        <div className="registry-audit-list" style={{marginTop: 12}}>
                                            {(viewingFarmer.auditLog || []).map((l) => (
                                                <div className="registry-audit-row" key={l.id}>
                                                    <div className="registry-audit-meta">
                                                                <span
                                                                    className="registry-audit-ts">{new Date(l.ts).toLocaleString()}</span>
                                                        <span className="registry-audit-type">{l.type}</span>
                                                    </div>
                                                    <div className="registry-audit-msg">{l.message}</div>
                                                    <div className="registry-audit-sub">{l.userId} ({l.role})
                                                    </div>
                                                </div>))}
                                        </div>
                                        <button type="button" className="registry-btn secondary"
                                                style={{marginTop: 12}}
                                                onClick={() => setAuditModalFarmer(viewingFarmer)}>
                                            Open full audit viewer
                                        </button>
                                    </>)}
                                </div>
                            </div>

                            <div className="profile-side-pane-v6">
                                <div className="pane-card-v6">
                                    <h3 className="pane-card-title-v6">Summary</h3>
                                    <div className="summary-list-v6">
                                        <div className="summary-item-v6">
                                            <div className="summary-icon-v6 green"><MapPin size={20}/></div>
                                            <div className="summary-details-v6">
                                                <span className="summary-label-v6">Total Land</span>
                                                <span className="summary-value-v6">
            {viewingFarmer.total_land_area > 0 ? `${viewingFarmer.total_land_area} ha` : '—'}
        </span>
                                            </div>
                                        </div>
                                        <div className="summary-item-v6">
                                            <div className="summary-icon-v6 orange"><Activity size={20}/></div>
                                            <div className="summary-details-v6">
                                                <span className="summary-label-v6">Owns Livestock</span>
                                                <span className="summary-value-v6">
            {viewingFarmer.owns_livestock || '—'}
        </span>
                                            </div>
                                        </div>
                                        <div className="summary-item-v6">
                                            <div className="summary-icon-v6 green"><Wheat size={20}/></div>
                                            <div className="summary-details-v6">
                                                <span className="summary-label-v6">Primary Commodity</span>
                                                <span className="summary-value-v6">
            {viewingFarmer.primary_commodity || '—'}
        </span>
                                            </div>
                                        </div>
                                        <div className="summary-item-v6">
                                            <div className="summary-icon-v6 blue"><Activity size={20}/></div>
                                            <div className="summary-details-v6">
                                                <span className="summary-label-v6">Last Updated</span>
                                                <span className="summary-value-v6">
            {viewingFarmer.lastUpdatedAt ? viewingFarmer.lastUpdatedAt.split('T')[0] : '—'}
        </span>
                                            </div>
                                        </div>
                                        <div className="summary-item-v6">
                                            <div className="summary-icon-v6 orange"><Activity size={20}/></div>
                                            <div className="summary-details-v6">
                                                <span className="summary-label-v6">Livestock</span>
                                                <span
                                                    className="summary-value-v6">{viewingFarmer.livestockCount ?? 6} animals</span>
                                            </div>
                                        </div>
                                        <div className="summary-item-v6">
                                            <div className="summary-icon-v6 green"><Wheat size={20}/></div>
                                            <div className="summary-details-v6">
                                                <span className="summary-label-v6">Active Crops</span>
<span className="summary-value-v6">{viewingFarmer.primary_commodity || '—'}</span>
                                            </div>
                                        </div>
                                        <div className="summary-item-v6">
                                            <div className="summary-icon-v6 blue"><Activity size={20}/></div>
                                            <div className="summary-details-v6">
                                                <span className="summary-label-v6">Last Updated</span>
                                                <span className="summary-value-v6">2024-02-10</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>)}
            </div>
        </main>

        {bulkResultMessage && (
            <div className="export-toast success" style={{position: 'fixed', bottom: 24, right: 24, zIndex: 11000}}>
                {bulkResultMessage}
            </div>)}

        {registrationSuccess && (
            <div className="registry-modal-overlay" onClick={() => setRegistrationSuccess(null)}>
                <div className="registry-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="registry-modal-header">
                        <h3>Registration submitted</h3>
                        <button type="button" className="registry-modal-close"
                                onClick={() => setRegistrationSuccess(null)} aria-label="Close">
                            <X size={20}/>
                        </button>
                    </div>
                    <div className="registry-modal-body">
                        <p>
                            New farmer ID: <strong>{registrationSuccess.id}</strong>
                        </p>
                        <p className="registry-muted">{registrationSuccess.name}</p>
                    </div>
                    <div className="registry-modal-footer">
                        <button type="button" className="registry-btn secondary"
                                onClick={() => setRegistrationSuccess(null)}>
                            Close
                        </button>
                        <button
                            type="button"
                            className="registry-btn primary"
                            onClick={() => {
                                setRegistrationSuccess(null);
                                setActiveTab('new');
                            }}
                        >
                            Register another
                        </button>
                    </div>
                </div>
            </div>)}

        {selectAllPagesOpen && (<SelectAllPagesModal
            count={filteredFarmersList.length}
            onClose={() => setSelectAllPagesOpen(false)}
            onConfirm={applySelectAllMatching}
        />)}
        {statusModalFarmer && (<StatusUpdateModal
            farmer={statusModalFarmer}
            onClose={() => setStatusModalFarmer(null)}
            onSubmit={submitStatusUpdate}
        />)}
        {faydaModalFarmer && (<FaydaVerifyModal
            farmer={faydaModalFarmer}
            allFarmers={farmers}
            onClose={() => setFaydaModalFarmer(null)}
            onComplete={submitFaydaVerification}
        />)}
        {auditModalFarmer && (<AuditLogModal
            farmer={auditModalFarmer}
            onClose={() => setAuditModalFarmer(null)}
            onExport={handleAuditExport}
        />)}
        {deleteModalFarmer && (<SoftDeleteModal
            farmer={deleteModalFarmer}
            onClose={() => setDeleteModalFarmer(null)}
            onConfirm={submitSoftDelete}
        />)}
        {bulkModal && (<BulkActionModal
            action={bulkModal}
            selectedCount={selectedFarmers.length}
            onClose={() => setBulkModal(null)}
            onSubmit={runBulkAction}
        />)}

        {/* Document Viewer Modal */}
        {viewingDocument && (<div className="doc-modal-overlay-v6" onClick={() => setViewingDocument(null)}>
            <div className="doc-modal-window-v6" onClick={(e) => e.stopPropagation()}>
                <div className="doc-modal-header-v6">
                    <h3 className="doc-modal-title-v6">{viewingDocument.name}</h3>
                    <div className="doc-modal-controls-v6">
                        <button
                            className="doc-modal-btn-v6"
                            onClick={() => handleDownload(viewingDocument)}
                        >
                            <Download size={18}/> Download
                        </button>
                        <button className="doc-modal-close-v6" onClick={() => setViewingDocument(null)}><X
                            size={20}/></button>
                    </div>
                </div>
                <div className="doc-modal-body-v6">
                    <img
                        src={viewingDocument.url}
                        alt={viewingDocument.name}
                        className="doc-preview-img-v6"
                        onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1586717791821-3f44a563cc4c?auto=format&fit=crop&q=80&w=1470';
                        }}
                    />
                </div>
            </div>
        </div>)}

        <div className="help-widget-container" ref={helpWindowRef}>
            {isHelpOpen && (<div className="help-popup-window">
                <div className="help-popup-header">
                    <h4 className="help-popup-title">Platform Help & Support</h4>
                    <button className="help-close-btn" onClick={() => setIsHelpOpen(false)}><X size={20}/>
                    </button>
                </div>
                <div className="help-popup-content">
                    <div className="help-section">
                        <h5 className="help-section-title"><Printer size={18} className="help-icon"/> Printing
                            ID Cards</h5>
                        <p className="help-section-text">Navigate to the farmer's profile and click "Print ID"
                            to generate a printable ID card.</p>
                    </div>
                </div>
                <div className="help-popup-footer" style={{
                    borderTop: '1px solid #f3f4f6',
                    backgroundColor: '#f9fafb',
                    fontSize: '13px',
                    color: '#6b7280'
                }}>
                    For technical support, contact: support@openagrinet.et
                </div>
            </div>)}
            {/* ID Card Preview Modal */}
            {showIdPreview && (<div className="modal-overlay-v6" onClick={() => setShowIdPreview(false)}>
                <div className="id-preview-modal-v6" onClick={e => e.stopPropagation()}>
                    <div className="id-modal-header-v6">
                        <div className="header-left-v6">
                            <h2 className="id-modal-title-v6">Farmer ID Card Preview</h2>
                            <p className="id-modal-subtitle-v6">OAN Card for {viewingFarmer.name}</p>
                        </div>
                        <div className="header-actions-v6">
                            <button
                                className="id-action-btn-v6 secondary"
                                onClick={() => handleDownloadAction("ID Card PDF", viewingFarmer)}
                            >
                                <Download size={18}/> Download PDF
                            </button>
                            <button
                                className="id-action-btn-v6 primary"
                                onClick={handlePrintAction}
                            >
                                <Printer size={18}/> Print
                            </button>
                            <button className="id-close-btn-v6" onClick={() => setShowIdPreview(false)}><X
                                size={20}/></button>
                        </div>
                    </div>

                    <div className="id-preview-content-v6">
                        <div className="id-preview-container-v6">
                            <div className="id-preview-section-v6">
                                <span className="preview-label-v6">Front</span>
                                <div className="farmer-id-card-front-v6">
                                    <div className="id-card-header-v6">
                                        <div className="id-logo-box-v6"><Wheat size={20} color="#ffffff"/></div>
                                        <div className="id-org-info-v6">
                                            <span className="id-country-v6">Ethiopia</span>
                                            <span className="id-platform-v6">OpenAgriNet</span>
                                        </div>
                                    </div>
                                    <div className="id-card-body-v6">
                                        <div className="id-card-label-v6">Full Name</div>
                                        <div className="id-field-value-v6">{viewingFarmer.name}</div>
                                        <div className="id-field-value-am-v6">ደሬጄ በቀለ {viewingFarmer.name}</div>

                                        <div className="id-card-grid-v6">
                                            <div>
                                                <div className="id-card-label-v6">Farmer ID</div>
                                                <div className="id-card-small-value-v6">{viewingFarmer.id}</div>
                                            </div>
                                            <div>
                                                <div className="id-card-label-v6">Registered</div>
                                                <div
                                                    className="id-card-small-value-v6">{viewingFarmer.registeredDate}</div>
                                            </div>
                                        </div>
                                        <div className="id-location-info-v6">
                                            {viewingFarmer.region} • {viewingFarmer.woreda} • {viewingFarmer.kebele}
                                        </div>
                                    </div>
                                    {/* Decorative Pattern Icon */}
                                    <div className="id-bg-pattern-v6"><Wheat size={180}/></div>
                                </div>
                            </div>

                            <div className="id-preview-section-v6">
                                <span className="preview-label-v6">Back</span>
                                <div className="farmer-id-card-back-v6">
                                    <div className="qr-container-v6">
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${viewingFarmer.id}`}
                                            alt="QR Code" className="id-qr-v6"/>
                                        <div className="qr-id-text-v6">{viewingFarmer.id}</div>
                                    </div>
                                    <div className="qr-instruction-v6">Scan QR code to view digital profile
                                    </div>

                                    <div className="id-back-footer-v6">
                                        <div className="footer-orgs-v6">
                                            <div className="footer-org-v6">
                                                <strong>OpenAgriNet</strong>
                                                <span>Digital Agriculture</span>
                                            </div>
                                            <div className="footer-org-v6 text-right">
                                                <strong>Ministry of Agriculture</strong>
                                                <span>Federal Republic of Ethiopia</span>
                                            </div>
                                        </div>
                                        <div className="footer-stamp-v6"><Wheat size={16}/></div>
                                    </div>
                                </div>
                            </div>
                        </div>


                        <div className="id-print-instructions-v6 mt-32">
                            <h4 className="instructions-title-v6">Print Instructions</h4>
                            <ul className="instructions-list-v6">
                                <li>Use CR80 card stock (85.6mm × 53.98mm / 3.370" × 2.125")</li>
                                <li>Print at 300 DPI for optimal quality</li>
                                <li>Use color printer for best results</li>
                                <li>Consider laminating for durability</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>)}
            {/* Full Record Preview Modal (Step 4 Style) */}
            {showRecordPreview && (<div className="modal-overlay-v6" onClick={() => setShowRecordPreview(false)}>
                <div className="id-preview-modal-v6 record-preview-modal-v6" onClick={e => e.stopPropagation()}>
                    <div className="id-modal-header-v6">
                        <div className="header-left-v6">
                            <h2 className="id-modal-title-v6">Farmer Registration Record</h2>
                            <p className="id-modal-subtitle-v6">Full profile preview
                                for {viewingFarmer.name}</p>
                        </div>
                        <div className="header-actions-v6">
                            <button
                                className="id-action-btn-v6 secondary"
                                onClick={() => handleDownloadAction("Record PDF", viewingFarmer)}
                            >
                                <Download size={18}/> Download PDF
                            </button>
                            <button
                                className="id-action-btn-v6 primary"
                                onClick={handlePrintAction}
                            >
                                <Printer size={18}/> Print Record
                            </button>
                            <button className="id-close-btn-v6" onClick={() => setShowRecordPreview(false)}><X
                                size={20}/></button>
                        </div>
                    </div>

                    <div className="id-preview-content-v6">
                        <div className="preview-record-grid-v6">
                            {/* Personal Info Section */}
                            <div className="preview-section-card-v6">
                                <div className="section-head-v6"><User size={18}/>
                                    <span>Personal Information</span></div>
                                <div className="preview-data-list-v6">
                                    <div className="p-data-item-v6"><span>Amharic Name</span><strong>ደሬጄ
                                        በቀለ {viewingFarmer.name}</strong></div>
                                    <div className="p-data-item-v6">
                                        <span>Gender</span><strong>{viewingFarmer.gender}</strong></div>
                                    <div className="p-data-item-v6">
                                        <span>Age</span><strong>{viewingFarmer.age}</strong></div>
                                    <div className="p-data-item-v6">
                                        <span>Mobile</span><strong>{viewingFarmer.phone}</strong></div>
                                    <div className="p-data-item-v6">
                                        <span>National ID</span><strong>{viewingFarmer.nationalId || '—'}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Location Info Section */}
                            <div className="preview-section-card-v6">
                                <div className="section-head-v6"><MapPin size={18}/>
                                    <span>Location Details</span></div>
                                <div className="preview-data-list-v6">
                                    <div className="p-data-item-v6">
                                        <span>Region</span><strong>{viewingFarmer.region}</strong></div>
                                    <div className="p-data-item-v6">
                                        <span>Woreda</span><strong>{viewingFarmer.woreda}</strong></div>
                                    <div className="p-data-item-v6">
                                        <span>Kebele</span><strong>{viewingFarmer.kebele}</strong></div>
                                    <div className="p-data-item-v6"><span>Farm Coordinates</span><strong>9.0123
                                        / 38.7612</strong></div>
                                </div>
                            </div>

                            {/* Household & Farming Section */}
                            <div className="preview-section-card-v6 full-width-preview-v6">
                                <div className="section-head-v6"><Users size={18}/>
                                    <span>Household & Farming Profile</span>
                                </div>
                                <div className="preview-data-grid-cols-3-v6">
                                    <div className="p-data-item-v6">
                                        <span>Head of Household</span><strong>Yes</strong></div>
                                    <div className="p-data-item-v6"><span>Household Size</span><strong>6
                                        members</strong></div>
                                    <div className="p-data-item-v6">
                                        <span>Dwelling Type</span><strong>{viewingFarmer.housing_type || '—'}</strong></div>
                                    <div className="p-data-item-v6">
                                        <span>Total Agri (Acres)</span><strong>3.5</strong></div>
                                    <div className="p-data-item-v6"><span>Farming Activity</span><strong>Mixed
                                        Farming</strong></div>
                                    <div className="p-data-item-v6"><span>Annual Income</span><strong>{viewingFarmer.annual_income || (viewingFarmer.income > 0 ? `${viewingFarmer.income} ETB` : '—')}
                                        ETB</strong></div>
                                </div>
                                <div className="preview-tags-section-v6 mt-16">
                                    <div className="p-data-item-v6 mb-8"><span>Agriculture Types</span></div>
                                    <div className="tag-cloud-v6">
                                        {(viewingFarmer.agricultureType && viewingFarmer.agricultureType.length > 0 ? viewingFarmer.agricultureType : (viewingFarmer.primary_commodity ? [viewingFarmer.primary_commodity] : ['—'])).map(t => (
                                            <span key={t} className="tag-item-v6 secondary">{t}</span>))}
                                    </div>
                                </div>
                            </div>

                            {/* Status Section */}
                            <div className="preview-section-card-v6 full-width-preview-v6 highlight-section-v6">
                                <div className="section-head-v6"><ShieldCheck size={18}/> <span>System & Compliance Status</span>
                                </div>
                                <div className="preview-data-grid-cols-3-v6">
                                    <div className="p-data-item-v6"><span>Farmer Card</span><span
                                        className="status-badge-v6 verified">Active</span></div>
                                    <div className="p-data-item-v6"><span>Reg. Status</span><span
                                        className="status-badge-v6 pending">Pending</span></div>
                                    <div className="p-data-item-v6">
                                        <span>Biometric</span><strong>Enrolled</strong></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>)}
        </div>
    </div>);
};

export default FarmerRegistry;
