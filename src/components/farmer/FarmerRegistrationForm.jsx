import React, { useState } from 'react';
import {
    User, MapPin, Users, CheckCircle, ArrowRight, ArrowLeft,
    Upload, Camera, Info, Search, Globe, Mail, Phone,
    Calendar, UserPlus, Trash2, Smartphone, ShieldCheck, ChevronDown
} from 'lucide-react';
import './FarmerRegistrationForm.css';

const FarmerRegistrationForm = ({ onCancel, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [isDevAgentOpen, setIsDevAgentOpen] = useState(false);
    const [openPhoneDropdown, setOpenPhoneDropdown] = useState(null);
    const [errors, setErrors] = useState({});

    const [selectedPrimaryCountry, setSelectedPrimaryCountry] = useState({ name: "Ethiopia", code: "+251", flag: "🇪🇹" });
    const [selectedAltCountry, setSelectedAltCountry] = useState({ name: "Ethiopia", code: "+251", flag: "🇪🇹" });

    const countries = [
        { name: "Ethiopia", code: "+251", flag: "🇪🇹" },
        { name: "Kenya", code: "+254", flag: "🇰🇪" },
        { name: "Djibouti", code: "+253", flag: "🇩🇯" },
        { name: "Sudan", code: "+249", flag: "🇸🇩" }
    ];

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

    const [formData, setFormData] = useState({
        // Step 1: Personal
        fullNameAmharic: '',
        fullNameLatin: '', // Mock pre-filled
        dob: '',
        gender: 'Male',
        nationalId: '', // Mock pre-filled
        mobileNumber: '', // Mock pre-filled
        altMobileNumber: '',
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

        // Step 3: Farming
        householdSize: '6',
        primaryActivity: '',
        headOfHousehold: true,
        landHoldings: '3.5',
        cooperatives: ['Urban Vegetable Growers'],
        incomeRange: ''
    });

    const steps = [
        { id: 1, title: 'Personal Information', icon: User },
        { id: 2, title: 'Location Information', icon: MapPin },
        { id: 3, title: 'Household & Farming Profile', icon: Users },
        { id: 4, title: 'Review & Submit', icon: CheckCircle }
    ];

    const validateStep1 = () => {
        const newErrors = {};
        if (!formData.fullNameAmharic.trim()) newErrors.fullNameAmharic = true;
        if (!formData.fullNameLatin.trim()) newErrors.fullNameLatin = true;
        if (!formData.dob) newErrors.dob = true;
        if (!formData.gender) newErrors.gender = true;
        if (!formData.nationalId.trim()) newErrors.nationalId = true;
        if (!formData.mobileNumber.trim()) newErrors.mobileNumber = true;
        if (!formData.altMobileNumber.trim()) newErrors.altMobileNumber = true;

        // Check if agent is selected
        if (!formData.devAgent || formData.devAgent === 'Select development agent') {
            newErrors.devAgent = true;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const nextStep = () => {
        if (currentStep === 1) {
            if (validateStep1()) {
                setCurrentStep(prev => Math.min(prev + 1, 4));
            }
        } else {
            setCurrentStep(prev => Math.min(prev + 1, 4));
        }
    };
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

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
                            <div className="uploaded-photo-wrapper">
                                <img src={formData.photoUrl} alt="Farmer" className="uploaded-photo" />
                                <button className="remove-photo-btn" onClick={(e) => { e.preventDefault(); setFormData({ ...formData, photoUrl: null }); }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="photo-upload-placeholder">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files[0]) {
                                            const url = URL.createObjectURL(e.target.files[0]);
                                            setFormData({ ...formData, photoUrl: url });
                                        }
                                    }}
                                    style={{ display: 'none' }}
                                    id="photo-upload-input"
                                />
                                <label htmlFor="photo-upload-input" className="default-avatar-wrapper">
                                    <svg viewBox="0 0 100 100" className="avatar-svg">
                                        <circle cx="50" cy="50" r="50" fill="#a1a1aa" />
                                        <circle cx="50" cy="38" r="16" fill="#e4e4e7" />
                                        <path d="M50 62 C25 62 12 92 12 100 L88 100 C88 92 75 62 50 62" fill="#e4e4e7" />
                                    </svg>
                                </label>
                                <button className="remove-photo-btn" onClick={(e) => { e.preventDefault(); }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
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
                            <label className="form-label">Full Name (Latin) <span className="req-v6">*</span></label>
                            <input
                                type="text"
                                className={`form-input-v6 ${errors.fullNameLatin ? 'error' : ''}`}
                                placeholder="Enter Full Name"
                                value={formData.fullNameLatin}
                                onChange={(e) => setFormData({ ...formData, fullNameLatin: e.target.value })}
                            />
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
                        <div className="form-group" style={{ position: 'relative', zIndex: openPhoneDropdown === 'primary' ? 1000 : 1 }}>
                            <label className="form-label">Mobile Number <span className="req-v6">*</span></label>
                            <div className={`phone-input-group-v6 ${errors.mobileNumber ? 'error' : ''}`}>
                                <div
                                    className="country-prefix-v6"
                                    onClick={() => setOpenPhoneDropdown(openPhoneDropdown === 'primary' ? null : 'primary')}
                                >
                                    <span>{selectedPrimaryCountry.flag} {selectedPrimaryCountry.code}</span>
                                    <ChevronDown size={14} style={{ marginLeft: '6px', opacity: 0.5 }} />
                                    {openPhoneDropdown === 'primary' && (
                                        <div className="country-dropdown-list-v6 animation-fadeInUp">
                                            {countries.map(c => (
                                                <div
                                                    key={c.code}
                                                    className="country-item-v6"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedPrimaryCountry(c);
                                                        setOpenPhoneDropdown(null);
                                                    }}
                                                >
                                                    <span>{c.flag}</span>
                                                    <span>{c.code}</span>
                                                    <span style={{ fontSize: '11px', opacity: 0.7, marginLeft: 'auto' }}>{c.name}</span>
                                                </div>
                                            ))}
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
                        <div className="form-group" style={{ position: 'relative', zIndex: openPhoneDropdown === 'alt' ? 1000 : 1 }}>
                            <label className="form-label">(Shared/Alt) Mobile Number <span className="req-v6">*</span></label>
                            <div className={`phone-input-group-v6 ${errors.altMobileNumber ? 'error' : ''}`}>
                                <div
                                    className="country-prefix-v6"
                                    onClick={() => setOpenPhoneDropdown(openPhoneDropdown === 'alt' ? null : 'alt')}
                                >
                                    <span>{selectedAltCountry.flag} {selectedAltCountry.code}</span>
                                    <ChevronDown size={14} style={{ marginLeft: '6px', opacity: 0.5 }} />
                                    {openPhoneDropdown === 'alt' && (
                                        <div className="country-dropdown-list-v6 animation-fadeInUp">
                                            {countries.map(c => (
                                                <div
                                                    key={c.code}
                                                    className="country-item-v6"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedAltCountry(c);
                                                        setOpenPhoneDropdown(null);
                                                    }}
                                                >
                                                    <span>{c.flag}</span>
                                                    <span>{c.code}</span>
                                                    <span style={{ fontSize: '11px', opacity: 0.7, marginLeft: 'auto' }}>{c.name}</span>
                                                </div>
                                            ))}
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
                        <div className="form-group" style={{ position: 'relative', zIndex: isDevAgentOpen ? 1010 : 1 }}>
                            <label className="form-label">Development Agent <span className="req-v6">*</span></label>
                            <div className={`custom-dropdown-v6 ${errors.devAgent ? 'error' : ''}`}>
                                <div
                                    className={`dropdown-trigger-v6 ${isDevAgentOpen ? 'open' : ''}`}
                                    onClick={() => setIsDevAgentOpen(!isDevAgentOpen)}
                                >
                                    <span>{formData.devAgent || "Select development agent"}</span>
                                    <ArrowRight size={16} className="chevron-v6" style={{ transform: isDevAgentOpen ? 'rotate(-90deg)' : 'rotate(90deg)', transition: 'all 0.3s' }} />
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
                            <label className="modern-checkbox-v6 no-border" style={{ padding: 0 }}>
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
                <div className="location-inputs-pane">
                    <div className="form-grid-2col-nested">
                        <div className="form-group">
                            <label className="form-label">Region *</label>
                            <select className="form-select-v6">
                                <option value="">Select region</option>
                                <option value="Oromia">Oromia</option>
                                <option value="Amhara">Amhara</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Zone</label>
                            <input type="text" className="form-input-v6" value={formData.zone} disabled />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Woreda *</label>
                            <select className="form-select-v6">
                                <option value="">Select woreda</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Kebele *</label>
                            <input type="text" className="form-input-v6" value={formData.kebele} />
                        </div>
                    </div>
                    <div className="form-group mt-16">
                        <label className="form-label">Village/Got Name *</label>
                        <input type="text" className="form-input-v6" value={formData.village} />
                    </div>

                    <div className="gps-coordinates-group mt-24">
                        <label className="form-label">GPS Coordinates</label>
                        <div className="form-grid-2col-nested">
                            <div className="coord-input-wrapper">
                                <span className="coord-label">Latitude</span>
                                <input type="text" className="form-input-v6 coord-input" value={formData.latitude} readOnly />
                            </div>
                            <div className="coord-input-wrapper">
                                <span className="coord-label">Longitude</span>
                                <input type="text" className="form-input-v6 coord-input" value={formData.longitude} readOnly />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="map-integration-pane">
                    <div className="map-header-v6">
                        <span className="map-pane-title">Current Geolocation</span>
                        <div className="map-search-bar-v6">
                            <Search size={16} className="map-search-icon" />
                            <input type="text" placeholder="Search address or place (e.g., Bole, Addis Ababa)" />
                            <button className="map-search-btn-v6"><Search size={14} /> Search</button>
                            <button className="map-gps-btn-v6"><Globe size={14} /> GPS</button>
                        </div>
                    </div>
                    <div className="map-placeholder-v6">
                        <img
                            src="https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/38.7469,9.0320,13,0/800x450?access_token=mock"
                            alt="Map Placeholder"
                            className="map-image-mock"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/800x450?text=Interactive+Map+System+Active'; }}
                        />
                        <div className="map-marker-v6">
                            <div className="marker-pin"></div>
                        </div>
                        <div className="map-coords-badge-v6">
                            <MapPin size={12} />
                            <span>9.032000, 38.746900</span>
                        </div>
                        <div className="map-controls-v6">
                            <button className="map-ctrl-btn">+</button>
                            <button className="map-ctrl-btn">-</button>
                            <button className="map-ctrl-btn"><Globe size={14} /></button>
                        </div>
                    </div>
                    <div className="map-stats-row">
                        <div className="map-stat-card">
                            <div className="map-stat-label">Current Latitude</div>
                            <div className="map-stat-value">9.032000°</div>
                        </div>
                        <div className="map-stat-card">
                            <div className="map-stat-label">Current Longitude</div>
                            <div className="map-stat-value">38.746900°</div>
                        </div>
                    </div>
                    <p className="map-instructions-v6">
                        Instructions: Click anywhere on the map to set location, use the GPS button to get current location, or search for an address. You can add custom pins using the + button and edit or delete them as needed.
                    </p>
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div className="registration-step-content animation-fadeIn">
            <div className="form-section-header">
                <h3 className="form-section-title">Household & Farming Profile</h3>
            </div>

            <div className="form-grid-2col">
                <div className="form-group">
                    <label className="form-label">Household Size *</label>
                    <input type="number" className="form-input-v6" value={formData.householdSize} />
                </div>
                <div className="form-group">
                    <label className="form-label">Primary Farming Activity *</label>
                    <select className="form-select-v6">
                        <option value="">Select activity</option>
                        <option value="Crop Production">Crop Production</option>
                        <option value="Livestock">Livestock</option>
                    </select>
                </div>
            </div>

            <div className="form-checkbox-group mt-16">
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

            <div className="form-group mt-24">
                <label className="form-label">Total Land Holdings (hectares) *</label>
                <input type="text" className="form-input-v6" value={formData.landHoldings} />
            </div>

            <div className="cooperative-membership-section mt-24">
                <label className="form-label">Cooperative Membership</label>
                <div className="coop-grid-v6">
                    {[
                        'Addis Coffee Cooperative', 'Urban Farmers Union',
                        'Bole Agricultural Union', 'Women Farmers Association',
                        'Urban Vegetable Growers', 'Entoto Livestock Union',
                        'Highland Farmers', 'Nifas Silk Agricultural Cooperative',
                        'Organic Farmers Network', 'Teff Producers Association'
                    ].map(coop => (
                        <label key={coop} className="modern-checkbox-v6 no-border">
                            <input
                                type="checkbox"
                                checked={formData.cooperatives.includes(coop)}
                                onChange={() => {
                                    const newCoops = formData.cooperatives.includes(coop)
                                        ? formData.cooperatives.filter(c => c !== coop)
                                        : [...formData.cooperatives, coop];
                                    setFormData({ ...formData, cooperatives: newCoops });
                                }}
                            />
                            <span className="checkbox-checkmark-v6"></span>
                            <span className="checkbox-label-v6">{coop}</span>
                        </label>
                    ))}
                </div>
            </div>

            <div className="form-group mt-32">
                <label className="form-label">Annual Income Range *</label>
                <select className="form-select-v6">
                    <option value="">Select income range</option>
                    <option value="Low">Below 50,000 ETB</option>
                    <option value="Medium">50,000 - 150,000 ETB</option>
                    <option value="High">Above 150,000 ETB</option>
                </select>
            </div>
        </div>
    );

    const renderStep4 = () => (
        <div className="registration-step-content animation-fadeIn">
            <div className="form-section-header">
                <h3 className="form-section-title">Review & Submit</h3>
            </div>

            <div className="review-container-v6">
                <div className="review-section-v6">
                    <div className="review-header-v6">
                        <span className="review-title">Personal Information</span>
                        <button className="review-edit-btn-v6" onClick={() => setCurrentStep(1)}>Edit</button>
                    </div>
                    <div className="review-grid-v6">
                        <div className="review-item"><span className="review-label">Full Name (English) *:</span> <span className="review-value">-</span></div>
                        <div className="review-item"><span className="review-label">Full Name (Local):</span> <span className="review-value">{formData.fullNameLatin}</span></div>
                        <div className="review-item"><span className="review-label">Date of Birth:</span> <span className="review-value">-</span></div>
                        <div className="review-item"><span className="review-label">Gender:</span> <span className="review-value">-</span></div>
                        <div className="review-item"><span className="review-label">National ID:</span> <span className="review-value">{formData.nationalId}</span></div>
                        <div className="review-item"><span className="review-label">Phone:</span> <span className="review-value">-</span></div>
                        <div className="review-item"><span className="review-label">Biometric:</span> <span className="review-value">Not enrolled</span></div>
                    </div>
                </div>

                <div className="review-section-v6">
                    <div className="review-header-v6">
                        <span className="review-title">Location Information</span>
                        <button className="review-edit-btn-v6" onClick={() => setCurrentStep(2)}>Edit</button>
                    </div>
                    <div className="review-grid-v6">
                        <div className="review-item"><span className="review-label">Region:</span> <span className="review-value">-</span></div>
                        <div className="review-item"><span className="review-label">Woreda:</span> <span className="review-value">-</span></div>
                        <div className="review-item"><span className="review-label">Kebele:</span> <span className="review-value">-</span></div>
                        <div className="review-item"><span className="review-label">Village:</span> <span className="review-value">-</span></div>
                        <div className="review-item"><span className="review-label">GPS:</span> <span className="review-value">-</span></div>
                    </div>
                </div>

                <div className="review-section-v6">
                    <div className="review-header-v6">
                        <span className="review-title">Household & Farming Profile</span>
                        <button className="review-edit-btn-v6" onClick={() => setCurrentStep(3)}>Edit</button>
                    </div>
                    <div className="review-grid-v6">
                        <div className="review-item"><span className="review-label">Household Size:</span> <span className="review-value">-</span></div>
                        <div className="review-item"><span className="review-label">Head of Household:</span> <span className="review-value">Yes</span></div>
                        <div className="review-item"><span className="review-label">Farming Activity:</span> <span className="review-value">-</span></div>
                        <div className="review-item"><span className="review-label">Land Holdings:</span> <span className="review-value">-</span></div>
                        <div className="review-item"><span className="review-label">Annual Income:</span> <span className="review-value">-</span></div>
                        <div className="review-item"><span className="review-label">Cooperatives:</span> <span className="review-value">None</span></div>
                    </div>
                </div>
            </div>

            <div className="final-confirmation-v6 mt-24">
                <label className="modern-checkbox-v6 bg-blue-light">
                    <input type="checkbox" />
                    <span className="checkbox-checkmark-v6"></span>
                    <span className="checkbox-label-v6">I confirm this information is accurate and complete</span>
                </label>
            </div>
        </div>
    );

    return (
        <div className="farmer-registration-portal">
            <div className="registration-main-card card width-card mt-24">
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
                        {currentStep === 4 && (
                            <button className="footer-nav-btn-v6 draft-btn">
                                Save as Draft
                            </button>
                        )}
                        <button
                            className={`footer-nav-btn-v6 primary ${currentStep === 4 ? 'submit-btn' : ''}`}
                            onClick={currentStep === 4 ? onComplete : nextStep}
                        >
                            <span>{currentStep === 4 ? 'Submit Registration' : 'Next'}</span>
                            {currentStep < 4 && <ArrowRight size={18} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FarmerRegistrationForm;
