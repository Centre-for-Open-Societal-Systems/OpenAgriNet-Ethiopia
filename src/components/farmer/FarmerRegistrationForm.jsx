import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    User, MapPin, Users, CheckCircle, ArrowRight, ArrowLeft, ArrowDown,
    Upload, Camera, Info, Search, Globe, Mail, Phone,
    Calendar, UserPlus, Trash2, Smartphone, ShieldCheck, ChevronDown, Layout
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

import './FarmerRegistrationForm.css';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MapUpdater = ({ lat, lng }) => {
    const map = useMap();
    useEffect(() => {
        if (lat && lng) {
            map.flyTo([parseFloat(lat), parseFloat(lng)], map.getZoom());
        }
    }, [lat, lng, map]);
    return null;
};


const FarmerRegistrationForm = ({ onCancel, onComplete, initialData = null }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isDevAgentOpen, setIsDevAgentOpen] = useState(false);
    const [openPhoneDropdown, setOpenPhoneDropdown] = useState(null);
    const [openFarmingDropdown, setOpenFarmingDropdown] = useState(null);
    const [errors, setErrors] = useState({});
    const [countrySearch, setCountrySearch] = useState('');
    const devAgentRef = useRef(null);
    const primaryPhoneRef = useRef(null);
    const altPhoneRef = useRef(null);
    const activityRef = useRef(null);
    const coopRef = useRef(null);
    const agriRef = useRef(null);
    const incomeRef = useRef(null);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (devAgentRef.current && !devAgentRef.current.contains(event.target)) setIsDevAgentOpen(false);
            if (primaryPhoneRef.current && !primaryPhoneRef.current.contains(event.target)) {
                if (openPhoneDropdown === 'primary') setOpenPhoneDropdown(null);
            }
            if (altPhoneRef.current && !altPhoneRef.current.contains(event.target)) {
                if (openPhoneDropdown === 'alt') setOpenPhoneDropdown(null);
            }
            if (activityRef.current && !activityRef.current.contains(event.target)) {
                if (openFarmingDropdown === 'activity') setOpenFarmingDropdown(null);
            }
            if (coopRef.current && !coopRef.current.contains(event.target)) {
                if (openFarmingDropdown === 'coop') setOpenFarmingDropdown(null);
            }
            if (agriRef.current && !agriRef.current.contains(event.target)) {
                if (openFarmingDropdown === 'agri') setOpenFarmingDropdown(null);
            }
            if (incomeRef.current && !incomeRef.current.contains(event.target)) {
                if (openFarmingDropdown === 'currency') setOpenFarmingDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openPhoneDropdown, openFarmingDropdown]);

    // Initialize with existing data if editing
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({
                ...prev,
                fullNameLatin: initialData.name,
                fullNameAmharic: initialData.fullNameAmharic || initialData.name,
                gender: initialData.gender,
                mobileNumber: initialData.phone,
                email: initialData.email,
                region: initialData.region,
                woreda: initialData.woreda,
                kebele: initialData.kebele,
                landHoldings: initialData.acres.replace(' Acres', ''),
                agricultureType: initialData.crops || []
            }));
            setCurrentStep(4); // Go straight to Review & Submit
        }
    }, [initialData]);


    const [selectedPrimaryCountry, setSelectedPrimaryCountry] = useState({ name: "Ethiopia", code: "+251", flag: "🇪🇹" });
    const [selectedAltCountry, setSelectedAltCountry] = useState({ name: "Ethiopia", code: "+251", flag: "🇪🇹" });

    const countries = [
        { name: "Ethiopia", code: "+251", flag: "🇪🇹" },
        { name: "Kenya", code: "+254", flag: "🇰🇪" },
        { name: "Nigeria", code: "+234", flag: "🇳🇬" },
        { name: "South Africa", code: "+27", flag: "🇿🇦" },
        { name: "Egypt", code: "+20", flag: "🇪🇬" },
        { name: "Djibouti", code: "+253", flag: "🇩🇯" },
        { name: "Sudan", code: "+249", flag: "🇸🇩" },
        { name: "Somalia", code: "+252", flag: "🇸🇴" },
        { name: "Eritrea", code: "+291", flag: "🇪🇷" },
        { name: "India", code: "+91", flag: "🇮🇳" },
        { name: "United States", code: "+1", flag: "🇺🇸" },
        { name: "United Kingdom", code: "+44", flag: "🇬🇧" },
        { name: "Canada", code: "+1", flag: "🇨🇦" },
        { name: "Germany", code: "+49", flag: "🇩🇪" },
        { name: "France", code: "+33", flag: "🇫🇷" },
        { name: "China", code: "+86", flag: "🇨🇳" },
        { name: "Japan", code: "+81", flag: "🇯🇵" },
        { name: "Australia", code: "+61", flag: "🇦🇺" },
        { name: "Brazil", code: "+55", flag: "🇧🇷" },
        { name: "Russia", code: "+7", flag: "🇷🇺" }
    ];

    const filteredCountries = countries.filter(c =>
        c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
        c.code.includes(countrySearch)
    );


    const devAgents = [
        "Dawit Amare (ATI-DA-2021-001)",
        "Meseret Tadesse (ATI-DA-2021-002)",
        "Tesfaye Bekele (ATI-DA-2021-003)",
        "Tigist Hailu (ATI-DA-2022-004)",
        "Solomon Girma (ATI-DA-2022-005)",
        "Hanna Worku (ATI-DA-2022-006)",
        "Yohannes Desta (ATI-DA-2023-007)",
        "Marta Kebede (ATI-DA-2023-008)"
    ];

    const currencies = [
        { name: "Ethiopia", code: "ETB", flag: "🇪🇹" },
        { name: "Kenya", code: "KES", flag: "🇰🇪" },
        { name: "Nigeria", code: "NGN", flag: "🇳🇬" },
        { name: "United States", code: "USD", flag: "🇺🇸" },
        { name: "India", code: "INR", flag: "🇮🇳" },
        { name: "European Union", code: "EUR", flag: "🇪🇺" },
        { name: "United Kingdom", code: "GBP", flag: "🇬🇧" },
        { name: "South Africa", code: "ZAR", flag: "🇿🇦" },
        { name: "China", code: "CNY", flag: "🇨🇳" },
        { name: "Japan", code: "JPY", flag: "🇯🇵" }
    ];

    const ETHIOPIAN_REGIONS = [
        "Addis Ababa", "Afar", "Amhara", "Benishangul-Gumuz", "Dire Dawa",
        "Gambela", "Harari", "Oromia", "Sidama", "SNNPR", "Somali",
        "South West Ethiopia", "Tigray"
    ];

    const ETHIOPIAN_WOREDAS = {
        'Addis Ababa': ["Bole", "Yeka", "Nifas Silk-Lafto", "Kirkos", "Akaki-Kality", "Arada", "Gullele", "Kolfe Keranio", "Lideta", "Addis Ketema"],
        'Amhara': ["Bahir Dar Zuria", "Gondar Zuria", "Dessie Zuria", "Debre Markos", "Debre Tabor", "Woldia", "Lalibela"],
        'Oromia': ["Adama Zuria", "Jimma Zuria", "Sebeta Hawas", "Bishoftu", "Shashemene", "Ambo", "Asella", "Burayu", "Dukem", "Nekemte"],
        'Afar': ["Asayita", "Dubti", "Chifra", "Logiya"],
        'Tigray': ["Mekelle", "Adigrat", "Axum", "Shire", "Humera"],
        'Somali': ["Jijiga", "Gode", "Degahabur", "Kebridahar"],
        'SNNPR': ["Hawassa", "Arba Minch", "Dilla", "Hosaena", "Wolaita Sodo"],
        'Sidama': ["Hawassa City", "Yirgalem", "Aleta Wendo"],
        'Dire Dawa': ["Dire Dawa City", "Gurgura"],
        'Harari': ["Harar City", "Amir-Nur Woreda"],
        'Gambela': ["Gambela City", "Itang"],
        'Benishangul-Gumuz': ["Assosa", "Kamashi", "Metekel"],
        'South West Ethiopia': ["Bonga", "Mizan Aman", "Tepi"]
    };

    const AGRICULTURE_TYPES = [
        'Millet', 'Cotton', 'Maize', 'Vegetables', 'Wheat',
        'Sugarcane', 'Coconut', 'Mustard', 'Rice', 'Coffee'
    ];

    const COOPERATIVE_OPTIONS = [
        'Addis Coffee Cooperative', 'Urban Farmers Union',
        'Bole Agricultural Union', 'Women Farmers Association',
        'Urban Vegetable Growers', 'Entoto Livestock Union',
        'Highland Farmers', 'Nifas Silk Agricultural Cooperative',
        'Organic Farmers Network', 'Teff Producers Association',
        'Rural Seed Cooperative', 'Oromia Coffee Farmers', 'Sidama Coffee Union'
    ];

    const normalizeRegion = (nominatimState) => {
        if (!nominatimState) return '';
        const name = nominatimState.toLowerCase();

        // Accurate mapping to ETHIOPIAN_REGIONS
        if (name.includes('addis ababa')) return 'Addis Ababa';
        if (name.includes('afar')) return 'Afar';
        if (name.includes('amhara')) return 'Amhara';
        if (name.includes('benishangul') || name.includes('gumuz')) return 'Benishangul-Gumuz';
        if (name.includes('dire dawa')) return 'Dire Dawa';
        if (name.includes('gambela')) return 'Gambela';
        if (name.includes('harar')) return 'Harari';
        if (name.includes('oromia') || name.includes('oromiya')) return 'Oromia';
        if (name.includes('sidama')) return 'Sidama';
        if (name.includes('snnpr') || name.includes('southern nations')) return 'SNNPR';
        if (name.includes('somali')) return 'Somali';
        if (name.includes('south west ethiopia')) return 'South West Ethiopia';
        if (name.includes('tigray')) return 'Tigray';

        // Fallback: search for direct match in defined regions
        const directMatch = ETHIOPIAN_REGIONS.find(r => r.toLowerCase() === name || name.includes(r.toLowerCase()));
        if (directMatch) return directMatch;

        return nominatimState;
    };

    const normalizeWoreda = (foundWoreda, region) => {
        if (!foundWoreda || !region || !ETHIOPIAN_WOREDAS[region]) return foundWoreda;
        const list = ETHIOPIAN_WOREDAS[region];
        const normalizedFound = foundWoreda.toLowerCase().trim();

        // Try direct or partial matches within the hardcoded list
        const match = list.find(w =>
            w.toLowerCase() === normalizedFound ||
            w.toLowerCase().includes(normalizedFound) ||
            normalizedFound.includes(w.toLowerCase())
        );

        return match || foundWoreda;
    };

    const [formData, setFormData] = useState({
        // Step 1: Personal
        fullNameAmharic: '',
        fullNameLatin: '', // Mock pre-filled
        dob: '',
        gender: 'Male',
        nationalId: '', // Mock pre-filled
        mobileNumber: '', // Mock pre-filled
        altMobileNumber: '',
        email: '',
        devAgent: 'Select development agent',
        photoUrl: null,
        biometricEnrolled: false,

        // Step 2: Location
        region: '',
        zone: 'Auto-populated',
        woreda: '',
        kebele: 'Kebele 15',
        village: 'Shiro Meda',
        latitude: '9.032000',
        longitude: '38.746900',
        addressLine: '',
        mapSearchInput: '',

        // Step 3: Farming
        householdSize: '6',
        primaryActivity: '',
        headOfHousehold: true,
        landHoldings: '3.5',
        cooperatives: ['Urban Vegetable Growers'],
        incomeRange: '',
        incomeValue: '',
        incomeCurrency: { name: 'Ethiopia', code: 'ETB', flag: '🇪🇹' },
        agricultureType: [],
        farmerCardStatus: 'Active',
        registrationStatus: 'Pending'
    });

    const [activeReviewTab, setActiveReviewTab] = useState('Personal');
    const [editingField, setEditingField] = useState(null); // Track which field is being edited inline (e.g., 'fullNameAmharic')
    const [tempValue, setTempValue] = useState(''); // Hold the value during inline editing
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openReviewDropdown, setOpenReviewDropdown] = useState(null); // Track open dropdowns in Step 4
    const [hasAutoLocated, setHasAutoLocated] = useState(false);

    // Load Lottie player
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@dotlottie/player-component@latest/dist/dotlottie-player.mjs';
        script.type = 'module';
        document.head.appendChild(script);
        return () => {
            if (document.head.contains(script)) {
                document.head.removeChild(script);
            }
        };
    }, []);

    // Auto-locate on entering Step 2
    useEffect(() => {
        if (currentStep === 2 && !hasAutoLocated) {
            handleGPSClick();
            setHasAutoLocated(true);
        }
    }, [currentStep, hasAutoLocated]);

    const handleActualSubmit = () => {
        setIsSubmitting(true);
        // Simulate adding to list with animation duration (4s)
        setTimeout(() => {
            setIsSubmitting(false);
            setShowSubmitModal(false);
            if (onComplete) onComplete(formData);
        }, 4000);
    };

    const handleFinalSubmitAttempt = () => {
        setShowSubmitModal(true);
    };

    const steps = [
        { id: 1, title: 'Personal Information', icon: User },
        { id: 2, title: 'Location Information', icon: MapPin },
        { id: 3, title: 'Household & Farming Profile', icon: Users },
        { id: 4, title: 'Review & Submit', icon: CheckCircle }
    ];

    const validateStep1 = () => {
        const newErrors = {};
        if (!formData.fullNameAmharic.trim()) newErrors.fullNameAmharic = true;
        if (!formData.dob) {
            newErrors.dob = true;
        } else {
            const birthDate = new Date(formData.dob);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            if (age < 18) {
                newErrors.dob = true;
                alert("The farmer must be at least 18 years old to register.");
            }
        }
        if (!formData.gender) newErrors.gender = true;
        if (!formData.nationalId.trim()) newErrors.nationalId = true;

        // Basic phone validation (at least 9 digits)
        const phoneRegex = /^[0-9]{9,15}$/;
        if (!formData.mobileNumber.trim() || !phoneRegex.test(formData.mobileNumber.replace(/\s/g, ''))) {
            newErrors.mobileNumber = true;
        }
        // Optional alt mobile validation
        if (formData.altMobileNumber.trim() && !phoneRegex.test(formData.altMobileNumber.replace(/\s/g, ''))) {
            newErrors.altMobileNumber = true;
        }

        if (!formData.devAgent || formData.devAgent === 'Select development agent') {
            newErrors.devAgent = true;
        }

        // Email validation (Required)
        if (!formData.email.trim()) {
            newErrors.email = true;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = true;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors = {};
        if (!formData.region) newErrors.region = true;
        if (!formData.woreda) newErrors.woreda = true;
        if (!formData.kebele.trim()) newErrors.kebele = true;
        if (!formData.village.trim()) newErrors.village = true;
        if (!formData.latitude || isNaN(formData.latitude) || formData.latitude === '9.032000') newErrors.latitude = true;
        if (!formData.longitude || isNaN(formData.longitude) || formData.longitude === '38.746900') newErrors.longitude = true;

        setErrors(newErrors);
        const isValid = Object.keys(newErrors).length === 0;
        if (!isValid) {
            alert("Please provide complete location information, including GPS coordinates from the map.");
        }
        return isValid;
    };

    const validateStep3 = () => {
        const newErrors = {};
        if (!formData.householdSize || parseInt(formData.householdSize) <= 0) newErrors.householdSize = true;
        if (!formData.primaryActivity) newErrors.primaryActivity = true;
        if (!formData.landHoldings || parseFloat(formData.landHoldings) < 0) newErrors.landHoldings = true;
        if (!formData.incomeValue || parseFloat(formData.incomeValue) < 0) newErrors.incomeValue = true;
        if (!formData.agricultureType || formData.agricultureType.length === 0) newErrors.agricultureType = true;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const nextStep = () => {
        let isValid = false;
        if (currentStep === 1) isValid = validateStep1();
        else if (currentStep === 2) isValid = validateStep2();
        else if (currentStep === 3) isValid = validateStep3();
        else isValid = true; // Step 4 is review

        if (isValid) {
            setCurrentStep(prev => Math.min(prev + 1, 4));
            setErrors({}); // Clear errors when moving to next step
        }
    };
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    // Map & Geolocation handlers
    const handleGPSClick = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude.toFixed(6);
                const lon = position.coords.longitude.toFixed(6);
                setFormData(prev => ({ ...prev, latitude: lat, longitude: lon }));
                await handleReverseGeocode(lat, lon);
            }, (error) => {
                console.error("Error getting location: ", error);
                alert("Could not get your location. Please check permissions.");
            });
        } else {
            alert("Geolocation is not supported by your browser");
        }
    };

    const handleReverseGeocode = async (lat, lng) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
            const data = await response.json();
            if (data && data.address) {
                const addr = data.address;
                const normalizedReg = normalizeRegion(addr.state || addr.region || addr.city);

                // For Woreda, we try to match city/town/suburb
                let foundWoreda = addr.city || addr.town || addr.village || addr.county || addr.suburb || addr.city_district || '';
                if (normalizedReg === 'Addis Ababa') {
                    foundWoreda = addr.city_district || addr.suburb || addr.quarter || foundWoreda;
                }

                // Further refine woreda based on our list
                const refinedWoreda = normalizeWoreda(foundWoreda, normalizedReg);

                setFormData(prev => ({
                    ...prev,
                    zone: addr.suburb || addr.neighbourhood || addr.city_district || addr.county || 'Auto-resolved',
                    region: normalizedReg || prev.region,
                    woreda: refinedWoreda || foundWoreda || prev.woreda,
                    kebele: addr.suburb || addr.quarter || prev.kebele,
                    mapSearchInput: data.display_name
                }));
            }
        } catch (error) {
            console.error("Reverse geocoding error:", error);
        }
    };

    const handleMapSearch = async () => {
        if (!formData.mapSearchInput.trim()) return;
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.mapSearchInput)}&addressdetails=1`);
            const data = await response.json();
            if (data && data.length > 0) {
                const addr = data[0].address;
                const normalizedReg = normalizeRegion(addr.state || addr.region || addr.city);

                let foundWoreda = addr.city || addr.town || addr.village || addr.county || addr.suburb || addr.city_district || '';
                if (normalizedReg === 'Addis Ababa') {
                    foundWoreda = addr.city_district || addr.suburb || addr.quarter || foundWoreda;
                }

                const refinedWoreda = normalizeWoreda(foundWoreda, normalizedReg);

                setFormData(prev => ({
                    ...prev,
                    latitude: parseFloat(data[0].lat).toFixed(6),
                    longitude: parseFloat(data[0].lon).toFixed(6),
                    zone: addr.suburb || addr.neighbourhood || addr.city_district || addr.county || 'Auto-resolved from Search',
                    region: normalizedReg || prev.region,
                    woreda: refinedWoreda || foundWoreda || prev.woreda,
                }));
            } else {
                alert("Location not found");
            }
        } catch (error) {
            console.error("Geocoding error:", error);
            setFormData(prev => ({
                ...prev,
                latitude: (9.000000 + Math.random() * 0.1).toFixed(6),
                longitude: (38.700000 + Math.random() * 0.1).toFixed(6),
                zone: 'Auto-resolved Zone'
            }));
        }
    };

    const LocationMarker = () => {
        useMapEvents({
            async click(e) {
                const lat = e.latlng.lat.toFixed(6);
                const lon = e.latlng.lng.toFixed(6);
                setFormData(prev => ({ ...prev, latitude: lat, longitude: lon }));
                await handleReverseGeocode(lat, lon);
            },
        });

        return formData.latitude && formData.longitude ? (
            <Marker position={[parseFloat(formData.latitude), parseFloat(formData.longitude)]} />
        ) : null;
    };

    const renderStep1 = () => (
        <div className="registration-step-content animation-fadeIn">
            <div className="form-section-header">
                <h3 className="form-section-title">Personal Information</h3>
            </div>

            <div className="personal-split-layout">
                <div className="personal-photo-pane">
                    <label className="form-label" style={{ display: 'block', marginBottom: '8px' }}>Farmer Photo</label>
                    <div className="photo-upload-container">
                        {formData.photoUrl ? (
                            <img src={formData.photoUrl} alt="Farmer" className="uploaded-photo" />
                        ) : (
                            <div className="photo-upload-placeholder">
                                <svg viewBox="0 0 100 100" className="avatar-svg">
                                    <circle cx="50" cy="50" r="50" fill="#a0aec0" />
                                    <circle cx="50" cy="38" r="16" fill="#edf2f7" />
                                    <path d="M50 62 C25 62 12 92 12 100 L88 100 C88 92 75 62 50 62" fill="#edf2f7" />
                                </svg>
                            </div>
                        )}
                    </div>

                    <div className="photo-upload-controls mt-16">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                    const url = URL.createObjectURL(e.target.files[0]);
                                    setFormData({ ...formData, photoUrl: url, photoName: e.target.files[0].name });
                                }
                            }}
                            style={{ display: 'none' }}
                            id="photo-upload-input"
                        />
                        <div className="file-input-group-v6">
                            <input
                                type="text"
                                className="form-input-v6 file-name-display"
                                placeholder="Choose photo..."
                                value={formData.photoName || ''}
                                readOnly
                            />
                            <label htmlFor="photo-upload-input" className="btn-upload-v6">
                                Upload
                            </label>
                        </div>
                        {formData.photoUrl && (
                            <button
                                className="btn-remove-v6"
                                onClick={(e) => {
                                    e.preventDefault();
                                    setFormData({ ...formData, photoUrl: null, photoName: null });
                                }}
                            >
                                <Trash2 size={14} /> Remove Photo
                            </button>
                        )}
                    </div>


                </div>

                <div className="personal-details-pane">
                    <div className="form-grid-2col">
                        <div className="form-group">
                            <label className="form-label">Full Name (Local Language) <span className="req-v6">*</span></label>
                            <input
                                type="text"
                                className={`form-input-v6 ${errors.fullNameAmharic ? 'error' : ''}`}
                                placeholder="Enter Full Name"
                                value={formData.fullNameAmharic}
                                onChange={(e) => setFormData({ ...formData, fullNameAmharic: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Email Address <span className="req-v6">*</span></label>
                            <div className="input-with-icon-wrapper-v6">
                                <input
                                    type="email"
                                    className={`form-input-v6 ${errors.email ? 'error' : ''}`}
                                    placeholder="Enter Email Address"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Date of Birth <span className="req-v6">*</span></label>
                            <div className="input-with-icon-wrapper-v6">
                                <input
                                    type="date"
                                    className={`form-input-v6 ${errors.dob ? 'error' : ''}`}
                                    placeholder='DD/MM/YYYY'
                                    value={formData.dob}
                                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                    max={(() => {
                                        const today = new Date();
                                        const year = today.getFullYear() - 18;
                                        const month = String(today.getMonth() + 1).padStart(2, '0');
                                        const day = String(today.getDate()).padStart(2, '0');
                                        return `${year}-${month}-${day}`;
                                    })()}
                                />
                                <Calendar size={18} className="input-field-icon-v6" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Gender <span className="req-v6">*</span></label>
                            <div className={`form-segmented-control-v6 ${errors.gender ? 'error' : ''}`}>
                                {['Male', 'Female', 'Other'].map(option => (
                                    <button
                                        key={option}
                                        type="button"
                                        className={`form-tab-btn-v6 ${formData.gender === option ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, gender: option })}
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">National ID / Kebele ID <span className="req-v6">*</span></label>
                            <input
                                type="text"
                                className={`form-input-v6 ${errors.nationalId ? 'error' : ''}`}
                                placeholder='Enter National ID'
                                value={formData.nationalId}
                                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                            />
                        </div>
                        <div className="form-group" ref={primaryPhoneRef} style={{ position: 'relative', zIndex: openPhoneDropdown === 'primary' ? 2000 : 1 }}>
                            <label className="form-label">Mobile Number <span className="req-v6">*</span></label>
                            <div className={`phone-input-group-v6 ${errors.mobileNumber ? 'error' : ''}`}>
                                <div className="country-selector-v6" style={{ position: 'relative' }}>
                                    <div
                                        className="country-prefix-v6"
                                        onClick={() => setOpenPhoneDropdown(openPhoneDropdown === 'primary' ? null : 'primary')}
                                    >
                                        <span>{selectedPrimaryCountry.flag} {selectedPrimaryCountry.code}</span>
                                        <ChevronDown size={14} style={{ marginLeft: '6px', opacity: 0.5 }} />
                                    </div>
                                    {openPhoneDropdown === 'primary' && (
                                        <div className="country-dropdown-list-v6 animation-fadeInUp" onClick={(e) => e.stopPropagation()}>
                                            <div className="country-search-wrapper-v6">
                                                <Search size={14} className="country-search-icon-v6" />
                                                <input
                                                    type="text"
                                                    className="country-search-input-v6"
                                                    placeholder="Search country..."
                                                    value={countrySearch}
                                                    onChange={(e) => setCountrySearch(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="country-items-scroll-v6">
                                                {filteredCountries.map(c => (
                                                    <div
                                                        key={c.code + c.name}
                                                        className={`country-item-v6 ${selectedPrimaryCountry.code === c.code && selectedPrimaryCountry.name === c.name ? 'active' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedPrimaryCountry(c);
                                                            setOpenPhoneDropdown(null);
                                                            setCountrySearch('');
                                                        }}
                                                    >
                                                        <span>{c.flag}</span>
                                                        <span>{c.code}</span>
                                                        <span className="country-name-v6">{c.name}</span>
                                                    </div>
                                                ))}
                                                {filteredCountries.length === 0 && (
                                                    <div className="no-results-v6">No countries found</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <input
                                    type="text"
                                    className="phone-main-input-v6"
                                    placeholder='Enter Mobile Number'
                                    value={formData.mobileNumber}
                                    onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group" ref={altPhoneRef} style={{ position: 'relative', zIndex: openPhoneDropdown === 'alt' ? 2000 : 1 }}>
                            <label className="form-label">(Shared/Alt) Mobile Number</label>
                            <div className={`phone-input-group-v6 ${errors.altMobileNumber ? 'error' : ''}`}>
                                <div className="country-selector-v6" style={{ position: 'relative' }}>
                                    <div
                                        className="country-prefix-v6"
                                        onClick={() => setOpenPhoneDropdown(openPhoneDropdown === 'alt' ? null : 'alt')}
                                    >
                                        <span>{selectedAltCountry.flag} {selectedAltCountry.code}</span>
                                        <ChevronDown size={14} style={{ marginLeft: '6px', opacity: 0.5 }} />
                                    </div>
                                    {openPhoneDropdown === 'alt' && (
                                        <div className="country-dropdown-list-v6 animation-fadeInUp" onClick={(e) => e.stopPropagation()}>
                                            <div className="country-search-wrapper-v6">
                                                <Search size={14} className="country-search-icon-v6" />
                                                <input
                                                    type="text"
                                                    className="country-search-input-v6"
                                                    placeholder="Search country..."
                                                    value={countrySearch}
                                                    onChange={(e) => setCountrySearch(e.target.value)}
                                                    autoFocus
                                                />
                                            </div>
                                            <div className="country-items-scroll-v6">
                                                {filteredCountries.map(c => (
                                                    <div
                                                        key={c.code + c.name}
                                                        className={`country-item-v6 ${selectedAltCountry.code === c.code && selectedAltCountry.name === c.name ? 'active' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedAltCountry(c);
                                                            setOpenPhoneDropdown(null);
                                                            setCountrySearch('');
                                                        }}
                                                    >
                                                        <span>{c.flag}</span>
                                                        <span>{c.code}</span>
                                                        <span className="country-name-v6">{c.name}</span>
                                                    </div>
                                                ))}
                                                {filteredCountries.length === 0 && (
                                                    <div className="no-results-v6">No countries found</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <input
                                    type="text"
                                    className="phone-main-input-v6"
                                    // placeholder="911 234567"
                                    placeholder='Enter Mobile Number'
                                    value={formData.altMobileNumber}
                                    onChange={(e) => setFormData({ ...formData, altMobileNumber: e.target.value })}
                                />
                            </div>
                            <p className="form-helper-text">For receiving updates if the farmer doesn't have a phone</p>
                        </div>
                        <div className="form-group" ref={devAgentRef} style={{ position: 'relative', zIndex: isDevAgentOpen ? 1010 : 1 }}>
                            <label className="form-label">Development Agent <span className="req-v6">*</span></label>
                            <div className={`custom-dropdown-v6 ${errors.devAgent ? 'error' : ''}`}>
                                <div
                                    className={`dropdown-trigger-v6 ${isDevAgentOpen ? 'open' : ''}`}
                                    onClick={() => setIsDevAgentOpen(!isDevAgentOpen)}
                                >
                                    <span>{formData.devAgent || "Select development agent"}</span>
                                    <ArrowDown size={18} className={`chevron-v6 ${isDevAgentOpen ? 'open' : ''}`} strokeWidth={2} />
                                </div>
                                {isDevAgentOpen && (
                                    <div className="dropdown-list-v6 animation-fadeInUp">
                                        {devAgents.map((agent, idx) => (
                                            <div
                                                key={idx}
                                                className={`dropdown-item-v6 ${formData.devAgent === agent ? 'active' : ''}`}
                                                onClick={() => {
                                                    setFormData({ ...formData, devAgent: agent });
                                                    setIsDevAgentOpen(false);
                                                }}
                                            >
                                                {agent}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <p className="form-helper-text">Agent performing this registration</p>
                        </div>
                        <div className="form-group" style={{ gridColumn: '1 / -1', marginTop: '12px' }}>
                            <label className="modern-checkbox-v6 no-border" style={{ padding: 0, width: 'fit-content', display: 'inline-flex' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.biometricEnrolled}
                                    onChange={(e) => setFormData({ ...formData, biometricEnrolled: e.target.checked })}
                                />
                                <span className="checkbox-checkmark-v6" style={{ width: '28px', height: '28px' }}></span>
                                <span className="checkbox-label-v6" style={{ fontSize: '15px' }}>Biometric enrollment completed</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div className="registration-step-content animation-fadeIn">
            <div className="form-section-header">
                <h3 className="form-section-title">Location Information</h3>
            </div>

            <div className="location-split-layout">


                <div className="map-integration-pane">
                    <div className="map-header-v6">
                        <span className="map-pane-title">Current Geolocation</span>
                        <div className="map-search-bar-v6">
                            <Search size={16} className="map-search-icon" />
                            <input
                                type="text"
                                placeholder="Search address or place (e.g., Bole, Addis Ababa)"
                                value={formData.mapSearchInput || ''}
                                onChange={(e) => setFormData({ ...formData, mapSearchInput: e.target.value })}
                                onKeyDown={(e) => e.key === 'Enter' && handleMapSearch()}
                            />
                            <button className="map-search-btn-v6" onClick={handleMapSearch}>
                                <Search size={14} /> Search
                            </button>
                            <button className="map-gps-btn-v6" onClick={handleGPSClick}>
                                <Globe size={14} /> GPS
                            </button>
                        </div>
                    </div>
                    <div className="map-placeholder-v6" style={{ height: '350px', position: 'relative', overflow: 'hidden', display: 'block', padding: 0 }}>
                        <MapContainer
                            center={[parseFloat(formData.latitude) || 9.032, parseFloat(formData.longitude) || 38.7469]}
                            zoom={13}
                            scrollWheelZoom={true}
                            style={{ height: '100%', width: '100%', zIndex: 1 }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <LocationMarker />
                            <MapUpdater lat={formData.latitude} lng={formData.longitude} />
                        </MapContainer>
                        <div className="map-coords-badge-v6" style={{ zIndex: 1000, position: 'absolute', bottom: '16px', left: '16px' }}>
                            <MapPin size={12} />
                            <span>{formData.latitude}, {formData.longitude}</span>
                        </div>
                    </div>

                    <p className="map-instructions-v6">
                        Instructions: Click anywhere on the map to set location, use the GPS button to get current location, or search for an address. You can add custom pins using the + button and edit or delete them as needed.
                    </p>
                </div>

                <div className="location-inputs-pane">
                    <div className="form-grid-2col-nested">
                        <div className="form-group" style={{ position: 'relative', zIndex: openPhoneDropdown === 'region' ? 1005 : 1 }}>
                            <label className="form-label">Region <span className="req-v6">*</span></label>
                            <div className={`custom-dropdown-v6 ${errors.region ? 'error' : ''}`}>
                                <div
                                    className={`dropdown-trigger-v6 ${openPhoneDropdown === 'region' ? 'open' : ''}`}
                                    onClick={() => setOpenPhoneDropdown(openPhoneDropdown === 'region' ? null : 'region')}
                                >
                                    <span>{formData.region || "Select region"}</span>
                                    <ArrowDown size={18} className={`chevron-v6 ${openPhoneDropdown === 'region' ? 'open' : ''}`} strokeWidth={2} />
                                </div>
                                {openPhoneDropdown === 'region' && (
                                    <div className="dropdown-list-v6 animation-fadeInUp">
                                        {ETHIOPIAN_REGIONS.map((r, idx) => (
                                            <div
                                                key={idx}
                                                className={`dropdown-item-v6 ${formData.region === r ? 'active' : ''}`}
                                                onClick={() => {
                                                    setFormData({ ...formData, region: r, woreda: '' });
                                                    setOpenPhoneDropdown(null);
                                                }}
                                            >
                                                {r}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Zone</label>
                            <input type="text" className="form-input-v6" value={formData.zone} placeholder="Auto-populated" disabled />
                        </div>
                        <div className="form-group" style={{ position: 'relative', zIndex: openPhoneDropdown === 'woreda' ? 1005 : 1 }}>
                            <label className="form-label">Woreda <span className="req-v6">*</span></label>
                            <div className={`custom-dropdown-v6 ${errors.woreda ? 'error' : ''}`}>
                                <div
                                    className={`dropdown-trigger-v6 ${openPhoneDropdown === 'woreda' ? 'open' : ''}`}
                                    onClick={() => {
                                        if (!formData.region) {
                                            alert("Please select a region first");
                                            return;
                                        }
                                        setOpenPhoneDropdown(openPhoneDropdown === 'woreda' ? null : 'woreda');
                                    }}
                                >
                                    <span>{formData.woreda || "Select woreda"}</span>
                                    <ArrowDown size={18} className={`chevron-v6 ${openPhoneDropdown === 'woreda' ? 'open' : ''}`} strokeWidth={2} />
                                </div>
                                {openPhoneDropdown === 'woreda' && (
                                    <div className="dropdown-list-v6 animation-fadeInUp">
                                        {(ETHIOPIAN_WOREDAS[formData.region] || ["Woreda 1", "Woreda 2", "Woreda 3"]).map((w, idx) => (
                                            <div
                                                key={idx}
                                                className={`dropdown-item-v6 ${formData.woreda === w ? 'active' : ''}`}
                                                onClick={() => {
                                                    setFormData({ ...formData, woreda: w });
                                                    setOpenPhoneDropdown(null);
                                                }}
                                            >
                                                {w}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Kebele <span className="req-v6">*</span></label>
                            <input
                                type="text"
                                className={`form-input-v6 ${errors.kebele ? 'error' : ''}`}
                                value={formData.kebele}
                                placeholder="Enter Kebele"
                                onChange={(e) => setFormData({ ...formData, kebele: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-group mt-16">
                        <label className="form-label">Village/Got Name <span className="req-v6">*</span></label>
                        <input
                            type="text"
                            className={`form-input-v6 ${errors.village ? 'error' : ''}`}
                            value={formData.village}
                            placeholder="Enter Village/Got name"
                            onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                        />
                    </div>
                    <div className="form-group mt-16">
                        <label className="form-label">Address / Landmark</label>
                        <input
                            type="text"
                            className="form-input-v6"
                            placeholder="e.g. Near the large well, House #24"
                            value={formData.addressLine || ''}
                            onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                        />
                    </div>


                    <div className="gps-coordinates-group mt-24">
                        <label className="form-label">GPS Coordinates <span className="req-v6">*</span></label>
                        <div className="form-grid-2col-nested">
                            <div className="coord-input-wrapper">
                                <span className="coord-label">Latitude</span>
                                <input type="text" className={`form-input-v6 coord-input ${errors.latitude ? 'error' : ''}`} value={formData.latitude} readOnly />
                            </div>
                            <div className="coord-input-wrapper">
                                <span className="coord-label">Longitude</span>
                                <input type="text" className={`form-input-v6 coord-input ${errors.longitude ? 'error' : ''}`} value={formData.longitude} readOnly />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="registration-step-content animation-fadeIn">
            <div className="form-section-header">
                <h3 className="form-section-title">Household & Farming Profile</h3>
            </div>

            <div className="farming-split-layout mt-32">
                {/* Left Column: Cooperative Membership */}
                <div className="farming-left-pane">


                    <div className="form-group" ref={coopRef} style={{ position: 'relative', zIndex: openFarmingDropdown === 'coop' ? 1050 : 1 }}>
                        <label className="form-label">Cooperative Membership</label>
                        <div className="custom-dropdown-v6">
                            <div
                                className={`dropdown-trigger-v6 multi-trigger-v6 ${openFarmingDropdown === 'coop' ? 'open' : ''}`}
                                onClick={() => setOpenFarmingDropdown(openFarmingDropdown === 'coop' ? null : 'coop')}
                            >
                                <div className="trigger-chips-container-v6">
                                    <Users size={16} className="trigger-icon-v6" />
                                    {formData.cooperatives.length > 0 ? (
                                        <div className="chips-wrapper-v6">
                                            {formData.cooperatives.slice(0, 2).map(c => (
                                                <span key={c} className="selected-chip-v6">
                                                    {c}
                                                    <span
                                                        className="chip-remove-v6"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFormData({ ...formData, cooperatives: formData.cooperatives.filter(x => x !== c) });
                                                        }}
                                                    >×</span>
                                                </span>
                                            ))}
                                            {formData.cooperatives.length > 2 && (
                                                <span className="chips-count-badge-v6">+{formData.cooperatives.length - 2} more</span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="placeholder-v6">Select Cooperatives</span>
                                    )}
                                </div>
                                <ArrowDown size={18} className={`chevron-v6 ${openFarmingDropdown === 'coop' ? 'open' : ''}`} strokeWidth={2} />
                            </div>
                            {openFarmingDropdown === 'coop' && (
                                <div className="dropdown-list-v6 multi-select-list-v6 animation-fadeInUp" onClick={(e) => e.stopPropagation()}>
                                    {COOPERATIVE_OPTIONS.map(coop => (
                                        <div
                                            key={coop}
                                            className="dropdown-check-item-v6 clickable-row-v6"
                                            onClick={() => {
                                                const newCoops = formData.cooperatives.includes(coop)
                                                    ? formData.cooperatives.filter(c => c !== coop)
                                                    : [...formData.cooperatives, coop];
                                                setFormData({ ...formData, cooperatives: newCoops });
                                            }}
                                        >
                                            <div className="modern-checkbox-v6 no-border tighter" style={{ pointerEvents: 'none' }}>
                                                <input type="checkbox" checked={formData.cooperatives.includes(coop)} readOnly />
                                                <span className="checkbox-checkmark-v6"></span>
                                            </div>
                                            <span className="checkbox-label-v6">{coop}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-group mt-32" ref={agriRef} style={{ position: 'relative', zIndex: openFarmingDropdown === 'agri' ? 1049 : 1 }}>
                        <label className="form-label">Agriculture Type <span className="req-v6">*</span></label>
                        <div className={`custom-dropdown-v6 ${errors.agricultureType ? 'error' : ''}`}>
                            <div
                                className={`dropdown-trigger-v6 multi-trigger-v6 ${openFarmingDropdown === 'agri' ? 'open' : ''}`}
                                onClick={() => setOpenFarmingDropdown(openFarmingDropdown === 'agri' ? null : 'agri')}
                            >
                                <div className="trigger-chips-container-v6">
                                    <Layout size={16} className="trigger-icon-v6" />
                                    {formData.agricultureType.length > 0 ? (
                                        <div className="chips-wrapper-v6">
                                            {formData.agricultureType.slice(0, 5).map(c => (
                                                <span key={c} className="selected-chip-v6">
                                                    {c}
                                                    <span
                                                        className="chip-remove-v6"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFormData({ ...formData, agricultureType: formData.agricultureType.filter(x => x !== c) });
                                                        }}
                                                    >×</span>
                                                </span>
                                            ))}
                                            {formData.agricultureType.length > 5 && (
                                                <span className="chips-count-badge-v6">+{formData.agricultureType.length - 5} more</span>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="placeholder-v6">Select Agriculture Types</span>
                                    )}
                                </div>
                                <ArrowDown size={18} className={`chevron-v6 ${openFarmingDropdown === 'agri' ? 'open' : ''}`} strokeWidth={2} />
                            </div>
                            {openFarmingDropdown === 'agri' && (
                                <div className="dropdown-list-v6 multi-select-list-v6 animation-fadeInUp" onClick={(e) => e.stopPropagation()}>
                                    {AGRICULTURE_TYPES.map(crop => (
                                        <div
                                            key={crop}
                                            className="dropdown-check-item-v6 clickable-row-v6"
                                            onClick={() => {
                                                const newCrops = formData.agricultureType.includes(crop)
                                                    ? formData.agricultureType.filter(c => c !== crop)
                                                    : [...formData.agricultureType, crop];
                                                setFormData({ ...formData, agricultureType: newCrops });
                                            }}
                                        >
                                            <div className="modern-checkbox-v6 no-border tighter" style={{ pointerEvents: 'none' }}>
                                                <input type="checkbox" checked={formData.agricultureType.includes(crop)} readOnly />
                                                <span className="checkbox-checkmark-v6"></span>
                                            </div>
                                            <span className="checkbox-label-v6">{crop}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status Controls moved to left for balanced column heights and fixed width */}
                    <div className="form-grid-2col-nested mt-32">
                        <div className="form-group">
                            <label className="form-label">Farmer Card Status</label>
                            <div className="segmented-control-v6">
                                {['Active', 'Inactive'].map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        className={`segment-btn-v6 ${formData.farmerCardStatus === opt ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, farmerCardStatus: opt })}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Registration Status</label>
                            <div className="segmented-control-v6">
                                {['Verified', 'Pending', 'Rejected'].map(opt => (
                                    <button
                                        key={opt}
                                        type="button"
                                        className={`segment-btn-v6 ${formData.registrationStatus === opt ? 'active' : ''}`}
                                        onClick={() => setFormData({ ...formData, registrationStatus: opt })}
                                    >
                                        {opt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>




                    {/* Moved Status Controls here for better alignment */}

                </div>

                {/* Right Column: Other Elements */}
                <div className="farming-right-pane">
                    <div className="form-grid-2col-nested">
                        <div className="form-group">
                            <label className="form-label">Household Size <span className="req-v6">*</span></label>
                            <input
                                type="number"
                                className={`form-input-v6 ${errors.householdSize ? 'error' : ''}`}
                                placeholder="Enter size"
                                value={formData.householdSize}
                                onChange={(e) => setFormData({ ...formData, householdSize: e.target.value })}
                            />
                        </div>
                        <div className="form-group" ref={activityRef} style={{ position: 'relative', zIndex: openFarmingDropdown === 'activity' ? 1020 : 1 }}>
                            <label className="form-label">Primary Farming Activity <span className="req-v6">*</span></label>
                            <div className={`custom-dropdown-v6 ${errors.primaryActivity ? 'error' : ''}`}>
                                <div
                                    className={`dropdown-trigger-v6 ${openFarmingDropdown === 'activity' ? 'open' : ''}`}
                                    onClick={() => setOpenFarmingDropdown(openFarmingDropdown === 'activity' ? null : 'activity')}
                                >
                                    <span>{formData.primaryActivity || "Select activity"}</span>
                                    <ArrowDown size={18} className={`chevron-v6 ${openFarmingDropdown === 'activity' ? 'open' : ''}`} strokeWidth={2} />
                                </div>
                                {openFarmingDropdown === 'activity' && (
                                    <div className="dropdown-list-v6 animation-fadeInUp">
                                        {["Crop Production", "Livestock", "Agroforestry"].map((act, idx) => (
                                            <div
                                                key={idx}
                                                className={`dropdown-item-v6 ${formData.primaryActivity === act ? 'active' : ''}`}
                                                onClick={() => {
                                                    setFormData({ ...formData, primaryActivity: act });
                                                    setOpenFarmingDropdown(null);
                                                }}
                                            >
                                                {act}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Total Agri (Acres) <span className="req-v6">*</span></label>
                            <input
                                type="text"
                                className={`form-input-v6 ${errors.landHoldings ? 'error' : ''}`}
                                value={formData.landHoldings}
                                onChange={(e) => setFormData({ ...formData, landHoldings: e.target.value })}
                            />
                        </div>

                        <div className="form-group" ref={incomeRef} style={{ position: 'relative', zIndex: openFarmingDropdown === 'currency' ? 1020 : 1 }}>
                            <label className="form-label">Annual Income Value <span className="req-v6">*</span></label>
                            <div className={`income-input-group-v6 ${errors.incomeValue ? 'error' : ''}`}>
                                <div
                                    className="currency-selector-v6"
                                    onClick={() => setOpenFarmingDropdown(openFarmingDropdown === 'currency' ? null : 'currency')}
                                >
                                    <div className="currency-trigger-content-v6">
                                        <span className="currency-flag-v6">{formData.incomeCurrency.flag}</span>
                                        <span className="currency-code-v6">{formData.incomeCurrency.code}</span>
                                    </div>
                                    <ArrowDown size={14} className={`chevron-v6 ${openFarmingDropdown === 'currency' ? 'open' : ''}`} />

                                    {openFarmingDropdown === 'currency' && (
                                        <div className="currency-dropdown-list-v6 animation-fadeInUp" onClick={(e) => e.stopPropagation()}>
                                            <div className="country-items-scroll-v6" style={{ maxHeight: '200px' }}>
                                                {currencies.map(c => (
                                                    <div
                                                        key={c.code + c.name}
                                                        className={`currency-item-v6 ${formData.incomeCurrency.code === c.code ? 'active' : ''}`}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setFormData({ ...formData, incomeCurrency: c });
                                                            setOpenFarmingDropdown(null);
                                                        }}
                                                    >
                                                        <span>{c.flag}</span>
                                                        <span>{c.code}</span>
                                                        <span style={{ marginLeft: 'auto', fontSize: '11px', opacity: 0.6 }}>{c.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="number"
                                    className="income-main-input-v6"
                                    placeholder="Enter amount"
                                    value={formData.incomeValue}
                                    onChange={(e) => setFormData({ ...formData, incomeValue: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-checkbox-group-v6-fixed mt-64">
                        <label className="modern-checkbox-v6">
                            <input
                                type="checkbox"
                                checked={formData.headOfHousehold}
                                onChange={(e) => setFormData({ ...formData, headOfHousehold: e.target.checked })}
                            />
                            <span className="checkbox-checkmark-v6"></span>
                            <span className="checkbox-label-v6">Head of Household</span>
                        </label>
                    </div>
                </div>
            </div>

        </div>
    );

    const handleInlineEditStart = (field, value) => {
        setEditingField(field);
        setTempValue(value !== null && value !== undefined ? value : '');
    };

    const handleInlineSave = () => {
        if (editingField) {
            setFormData(prev => ({ ...prev, [editingField]: tempValue }));
            setEditingField(null);
        }
    };

    const handleInlineCancel = () => {
        setEditingField(null);
        setTempValue('');
    };

    const renderInlineMultiSelectField = (label, field, values, options) => {
        const isEditing = editingField === field;
        const currentVals = Array.isArray(values) ? values : [];
        const isDropdownOpen = openReviewDropdown === field;

        return (
            <div className="inline-edit-module-v6" style={{ gridColumn: 'span 2' }}>
                <div className="inline-edit-header-v6">
                    <span className="inline-field-label">{label}</span>
                </div>
                <div className={`review-static-box-v6 ${isEditing ? 'editing' : ''}`}>
                    {!isEditing && (
                        <span className="inline-edit-link" style={{ position: 'absolute', top: '12px', right: '16px' }} onClick={() => setEditingField(field)}>Edit</span>
                    )}
                    {currentVals.length === 0 && !isEditing && <span style={{ opacity: 0.5 }}>None selected</span>}
                    {currentVals.map(val => (
                        <div key={val} className="review-tag-v6">
                            {val}
                            {isEditing && (
                                <button
                                    className="tag-remove-v6"
                                    onClick={() => {
                                        const newVals = currentVals.filter(v => v !== val);
                                        setFormData({ ...formData, [field]: newVals });
                                    }}
                                >
                                    &times;
                                </button>
                            )}
                        </div>
                    ))}
                    {isEditing && options.filter(o => !currentVals.includes(o)).length > 0 && (
                        <div className="tag-add-container-v6" style={{ width: 'auto', minWidth: '180px' }}>
                            <div className="custom-dropdown-v6 tighter">
                                <div
                                    className={`dropdown-trigger-v6 ${isDropdownOpen ? 'open' : ''}`}
                                    onClick={() => setOpenReviewDropdown(isDropdownOpen ? null : field)}
                                    style={{ height: '36px', padding: '0 12px' }}
                                >
                                    <span style={{ fontSize: '13px' }}>Add from list...</span>
                                    <ArrowDown size={14} className={`chevron-v6 ${isDropdownOpen ? 'open' : ''}`} />
                                </div>
                                {isDropdownOpen && (
                                    <div className="dropdown-list-v6 animation-fadeInUp" style={{ top: '100%', left: 0, right: 0, zIndex: 1100 }}>
                                        {options.filter(o => !currentVals.includes(o)).map((o, idx) => (
                                            <div
                                                key={idx}
                                                className="dropdown-item-v6"
                                                onClick={() => {
                                                    setFormData({ ...formData, [field]: [...currentVals, o] });
                                                    setOpenReviewDropdown(null);
                                                }}
                                                style={{ padding: '8px 12px', fontSize: '13px' }}
                                            >
                                                {o}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                {isEditing && (
                    <div className="inline-edit-actions-v6" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <button className="inline-save-btn" style={{ padding: '8px 24px', fontSize: '12px' }} onClick={() => {
                            setEditingField(null);
                            setOpenReviewDropdown(null);
                        }}>SAVE</button>
                        <span className="inline-cancel-link" onClick={() => {
                            setEditingField(null);
                            setOpenReviewDropdown(null);
                        }}>Cancel</span>
                    </div>
                )}
            </div>
        );
    };

    const renderInlineEditableField = (label, field, value, wide = false, options = null) => {
        const isEditing = editingField === field;
        const isDropdownOpen = openReviewDropdown === field;

        return (
            <div className={`inline-edit-module-v6 ${wide ? 'wide' : ''}`}>
                <div className="inline-edit-header-v6">
                    <span className="inline-field-label">{label}</span>
                </div>
                <div className="inline-field-container">
                    {isEditing ? (
                        <div className="inline-editing-wrapper">
                            {options ? (
                                <div className="custom-dropdown-v6" style={{ flex: 1 }}>
                                    <div
                                        className={`dropdown-trigger-v6 ${isDropdownOpen ? 'open' : ''}`}
                                        onClick={() => setOpenReviewDropdown(isDropdownOpen ? null : field)}
                                    >
                                        <span>{tempValue || "Select..."}</span>
                                        <ArrowDown size={18} className={`chevron-v6 ${isDropdownOpen ? 'open' : ''}`} />
                                    </div>
                                    {isDropdownOpen && (
                                        <div className="dropdown-list-v6 animation-fadeInUp" style={{ top: '100%', left: 0, right: 0, zIndex: 1100 }}>
                                            {options.map((o, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`dropdown-item-v6 ${tempValue === o ? 'active' : ''}`}
                                                    onClick={() => {
                                                        setTempValue(o);
                                                        setOpenReviewDropdown(null);
                                                    }}
                                                >
                                                    {o}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="inline-input-group">
                                    <input
                                        type="text"
                                        value={tempValue}
                                        onChange={(e) => setTempValue(e.target.value)}
                                        className="inline-edit-input"
                                        autoFocus
                                    />
                                </div>
                            )}
                            <div className="inline-action-btns">
                                <button className="inline-save-btn" style={{ padding: '8px 24px', fontSize: '12px' }} onClick={() => {
                                    handleInlineSave();
                                    setOpenReviewDropdown(null);
                                }}>SAVE</button>
                                <span className="inline-cancel-link" onClick={() => {
                                    handleInlineCancel();
                                    setOpenReviewDropdown(null);
                                }}>Cancel</span>
                            </div>
                        </div>
                    ) : (
                        <div className="inline-static-wrapper">
                            <div className="inline-data-box">{value || '-'}</div>
                            <span className="inline-edit-link" onClick={() => handleInlineEditStart(field, value)}>Edit</span>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const renderStep4 = () => (
        <div className="registration-step-content animation-fadeIn">
            <div className="form-section-header">
                <h3 className="form-section-title">Review & Submit</h3>
            </div>

            <div className="tabbed-review-layout">
                {/* Left Tabs Sidebar */}
                <div className="review-sidebar-v6">
                    <div
                        className={`review-tab-item-v6 ${activeReviewTab === 'Personal' ? 'active' : ''}`}
                        onClick={() => setActiveReviewTab('Personal')}
                    >
                        <User size={18} />
                        <span>Personal Information</span>
                    </div>
                    <div
                        className={`review-tab-item-v6 ${activeReviewTab === 'Location' ? 'active' : ''}`}
                        onClick={() => setActiveReviewTab('Location')}
                    >
                        <MapPin size={18} />
                        <span>Location Information</span>
                    </div>
                    <div
                        className={`review-tab-item-v6 ${activeReviewTab === 'Farming' ? 'active' : ''}`}
                        onClick={() => setActiveReviewTab('Farming')}
                    >
                        <Users size={18} />
                        <span>Household & Farming Profile</span>
                    </div>
                </div>

                {/* Right Content Pane */}
                <div className="review-content-pane-v6">
                    {activeReviewTab === 'Personal' && (
                        <div className="review-pane-inner animation-fadeInRight">
                            <div className="pane-header-v6">
                                <h4 className="pane-title-v6" style={{ border: 'none' }}>Personal Information</h4>
                            </div>

                            {/* Redesigned Premium Farmer Photo Section in Review */}
                            <div className="review-photo-container-v6 mb-40">
                                <label className="field-label-v6" style={{ marginBottom: '16px', display: 'block' }}>Farmer Identity Photo</label>
                                <div className="photo-identity-card-v6">
                                    <div className="identity-display-v6">
                                        {formData.photoUrl ? (
                                            <img src={formData.photoUrl} alt="Farmer" className="identity-img-v6" />
                                        ) : (
                                            <div className="identity-placeholder-v6">
                                                <svg viewBox="0 0 100 100" className="identity-svg-v6">
                                                    <circle cx="50" cy="50" r="50" fill="#f1f5f9" />
                                                    <circle cx="50" cy="38" r="16" fill="#cbd5e1" />
                                                    <path d="M50 62 C25 62 12 92 12 100 L88 100 C88 92 75 62 50 62" fill="#cbd5e1" />
                                                </svg>
                                            </div>
                                        )}

                                        <div className="identity-actions-overlay-v6">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                id="review-photo-upload"
                                                style={{ display: 'none' }}
                                                onChange={(e) => {
                                                    if (e.target.files && e.target.files[0]) {
                                                        const url = URL.createObjectURL(e.target.files[0]);
                                                        setFormData({ ...formData, photoUrl: url, photoName: e.target.files[0].name });
                                                    }
                                                }}
                                            />
                                            <label htmlFor="review-photo-upload" className="action-btn-mini-v6 upload" title="Replace Photo">
                                                <Upload size={18} strokeWidth={2.5} />
                                            </label>
                                            {formData.photoUrl && (
                                                <div
                                                    className="action-btn-mini-v6 remove"
                                                    onClick={() => setFormData({ ...formData, photoUrl: null, photoName: null })}
                                                    title="Remove Photo"
                                                >
                                                    <Trash2 size={18} strokeWidth={2.5} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="identity-details-v6">
                                        <div className="identity-status-v6">
                                            <span className={`status-dot-v6 ${formData.photoUrl ? 'ready' : 'missing'}`}></span>
                                            {formData.photoUrl ? "Identity Verified" : "Photo Required for Registry"}
                                        </div>
                                        <p className="identity-hint-v6">JPEG or PNG, Max 5MB. Must be a clear facial portrait.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="inline-edit-grid-v6">
                                {renderInlineEditableField("Full Name (Local)", "fullNameAmharic", formData.fullNameAmharic)}
                                {renderInlineEditableField("Email Address", "email", formData.email)}
                                {renderInlineEditableField("National ID", "nationalId", formData.nationalId)}
                                {renderInlineEditableField("Mobile Number", "mobileNumber", formData.mobileNumber)}
                                {renderInlineEditableField("Date of Birth", "dob", formData.dob)}
                                {renderInlineEditableField("Gender", "gender", formData.gender)}
                                {renderInlineEditableField("Farmer Status", "isFarmerActive", formData.isFarmerActive ? 'Active' : 'Inactive')}
                                {renderInlineEditableField("Development Agent", "devAgent", formData.devAgent)}
                            </div>
                        </div>
                    )}

                    {activeReviewTab === 'Location' && (
                        <div className="review-pane-inner animation-fadeInRight">
                            <div className="pane-header-v6">
                                <h4 className="pane-title-v6" style={{ border: 'none' }}>Location Information</h4>
                            </div>
                            <div className="inline-edit-grid-v6">
                                {renderInlineEditableField("Region", "region", formData.region)}
                                {renderInlineEditableField("Woreda", "woreda", formData.woreda)}
                                {renderInlineEditableField("Kebele", "kebele", formData.kebele)}
                                {renderInlineEditableField("Village", "village", formData.village)}
                                {renderInlineEditableField("Address / Landmark", "addressLine", formData.addressLine)}
                            </div>
                            <div className="pane-header-v6 mt-32">
                                <h4 className="pane-title-v6" style={{ border: 'none' }}>GPS Coordinates</h4>
                            </div>
                            <div className="inline-edit-grid-v6">
                                <div className="inline-edit-module-v6">
                                    <div className="inline-field-label">Latitude</div>
                                    <div className="review-static-box-v6">{formData.latitude}</div>
                                </div>
                                <div className="inline-edit-module-v6">
                                    <div className="inline-field-label">Longitude</div>
                                    <div className="review-static-box-v6">{formData.longitude}</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeReviewTab === 'Farming' && (
                        <div className="review-pane-inner animation-fadeInRight">
                            <div className="pane-header-v6">
                                <h4 className="pane-title-v6" style={{ border: 'none' }}>Household & Farming Profile</h4>
                            </div>
                            <div className="inline-edit-grid-v6">
                                {renderInlineEditableField("Household Size", "householdSize", formData.householdSize)}
                                {renderInlineEditableField("Total Area (Acres)", "landHoldings", formData.landHoldings)}
                                {renderInlineEditableField("Annual Income", "incomeValue", formData.incomeValue)}
                                {renderInlineEditableField("Card Status", "farmerCardStatus", formData.farmerCardStatus, false, ["Active", "Inactive"])}
                                {renderInlineEditableField("Registration Status", "registrationStatus", formData.registrationStatus, false, ["Verified", "Pending", "Rejected"])}
                                {renderInlineEditableField("Primary Farming Activity", "primaryActivity", formData.primaryActivity, false, ["Crop Production", "Livestock", "Agroforestry"])}

                                {renderInlineMultiSelectField(
                                    "Cooperative Membership",
                                    "cooperatives",
                                    formData.cooperatives,
                                    COOPERATIVE_OPTIONS
                                )}

                                {renderInlineMultiSelectField(
                                    "Agriculture Type",
                                    "agricultureType",
                                    formData.agricultureType,
                                    AGRICULTURE_TYPES
                                )}
                            </div>
                        </div>
                    )}

                    <div className="final-confirmation-v6 mt-48 pt-32" style={{ borderTop: '1px solid #f0f0f0' }}>
                        <label className="modern-checkbox-v6">
                            <input type="checkbox" />
                            <span className="checkbox-checkmark-v6"></span>
                            <span className="checkbox-label-v6">I certify that all information provided is accurate and represent the best of my knowledge.</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="farmer-registration-portal">
            {currentStep === 4 && (
                <div
                    className="back-navigator-v6"
                    onClick={onCancel}
                >
                    <ArrowLeft size={18} />
                    <span>Back</span>
                </div>
            )}

            <div className="registration-main-card card width-card mt-8">
                <div className="registration-stepper-wrapper">
                    <div className="registration-stepper-v6">
                        {steps.map((step) => (
                            <div
                                key={step.id}
                                className={`step-item-v6 ${currentStep === step.id ? 'active' : ''} ${currentStep > step.id ? 'completed' : ''}`}
                                onClick={() => currentStep > step.id && setCurrentStep(step.id)}
                            >
                                <div className="step-badge-v6">
                                    {currentStep > step.id ? <CheckCircle size={18} /> : step.id}
                                </div>
                                <span className="step-title-v6">{step.title}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card-body-v6">
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                    {currentStep === 4 && renderStep4()}
                </div>

                <div className="registration-footer-v6" style={{ justifyContent: currentStep === 1 ? 'flex-end' : 'space-between' }}>
                    {currentStep > 1 && (
                        <button
                            className="footer-nav-btn-v6 secondary"
                            onClick={prevStep}
                        >
                            <ArrowLeft size={18} />
                            <span>Previous</span>
                        </button>
                    )}

                    <div className="footer-actions-v6">
                        <button
                            className={`footer-nav-btn-v6 ${currentStep === 4 ? 'submit-btn-v6' : 'primary'}`}
                            onClick={currentStep === 4 ? handleFinalSubmitAttempt : nextStep}
                        >
                            <span>{currentStep === 4 ? 'Submit Registration' : 'Next'}</span>
                            {currentStep < 4 && <ArrowRight size={18} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Submission Confirmation Modal */}
            {showSubmitModal && createPortal(
                <div className="submit-modal-overlay-v6">
                    <div className="submit-modal-v6">
                        <div className="modal-header-v6">
                            <h3 className="modal-title-v6">Confirm Submission</h3>
                        </div>
                        <div className="modal-body-v6">
                            <p>Are you sure you want to submit this farmer registration? This will add the farmer to the registry list.</p>
                        </div>
                        <div className="modal-footer-v6">
                            <button
                                className="modal-btn-v6 secondary"
                                onClick={() => setShowSubmitModal(false)}
                                disabled={isSubmitting}
                            >
                                No, Review Again
                            </button>
                            <button
                                className={`modal-btn-v6 primary ${isSubmitting ? 'submitting-btn pulsate' : ''}`}
                                onClick={handleActualSubmit}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div className="spinner-mini-v6"></div>
                                        <span>Processing...</span>
                                    </div>
                                ) : 'Yes, Submit Registration'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default FarmerRegistrationForm;
