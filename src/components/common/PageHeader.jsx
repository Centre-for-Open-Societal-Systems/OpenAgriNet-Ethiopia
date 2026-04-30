import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Download, ChevronDown, FileSpreadsheet, FileText } from 'lucide-react';
import './PageHeader.css';

const PageHeader = ({
    title,
    subtitle,
    dateFilter,
    onDateFilterChange,
    showCustomDatePicker,
    setShowCustomDatePicker,
    datePickerRef,
    fromDate,
    toDate,
    onFromDateChange,
    onToDateChange,
    onApplyCustomDate,
    todayDate,
    showDownloadOptions,
    setShowDownloadOptions,
    downloadMenuRef,
    onExportCSV,
    onExportPDF,
    customDateLabel = "Select Date",
    hideDateFilter = false,
    hideDownload = false,
    primaryAction = null
}) => {
    const [showDateDropdown, setShowDateDropdown] = useState(false);
    const dateDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target)) {
                setShowDateDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="page-header">
            <div className="page-header-left">
                <h1>{title}</h1>
                <p>{subtitle}</p>
            </div>
            <div className="page-header-right">
                <div className="page-header-actions">
                    {!hideDateFilter && (
                        <div className="compact-date-wrapper">
                            <div className="compact-date-label">{customDateLabel}</div>
                            <div className="compact-date-select-container" ref={dateDropdownRef}>
                                <Calendar size={18} className="compact-icon text-gray" />
                                <div 
                                    className="compact-date-select" 
                                    onClick={() => setShowDateDropdown(!showDateDropdown)}
                                >
                                    {dateFilter}
                                    <ChevronDown 
                                        size={16} 
                                        className={`compact-date-chevron ${showDateDropdown ? 'rotated' : ''}`} 
                                        style={{
                                            transition: 'transform 0.2s',
                                            color: 'var(--text-secondary)',
                                            transform: showDateDropdown ? 'rotate(180deg)' : 'none'
                                        }} 
                                    />
                                </div>
                                
                                {showDateDropdown && (
                                    <div className="date-options-dropdown">
                                        {['Today', 'Yesterday', 'This Week', 'This Month', 'Custom Date'].map(option => (
                                            <div 
                                                key={option}
                                                className={`date-option ${dateFilter === option ? 'active' : ''}`}
                                                onClick={() => {
                                                    onDateFilterChange({ target: { value: option } });
                                                    setShowDateDropdown(false);
                                                    if (option === 'Custom Date' && !showCustomDatePicker) {
                                                        setShowCustomDatePicker(true);
                                                    }
                                                }}
                                            >
                                                {option}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {showCustomDatePicker && (
                                <div className="compact-custom-date-popup" ref={datePickerRef}>
                                    <div className="date-range-inputs">
                                        <div className="date-input-group">
                                            <label className="date-input-label">From Date</label>
                                            <input
                                                type="date"
                                                value={fromDate}
                                                onChange={onFromDateChange}
                                                className="custom-date-input"
                                                max={todayDate}
                                            />
                                        </div>
                                        <div className="date-input-group">
                                            <label className="date-input-label">To Date</label>
                                            <input
                                                type="date"
                                                value={toDate}
                                                onChange={onToDateChange}
                                                className="custom-date-input"
                                                max={todayDate}
                                            />
                                        </div>
                                        <div className="date-input-group button-group">
                                            <label className="date-input-label">&nbsp;</label>
                                            {fromDate && toDate && (
                                                <button
                                                    className="apply-custom-date-btn inline-btn"
                                                    onClick={() => {
                                                        onApplyCustomDate();
                                                        setShowCustomDatePicker(false);
                                                    }}
                                                >
                                                    Go
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {!hideDownload && (
                        <div className="download-action-wrapper" ref={downloadMenuRef}>
                            <button
                                className="download-action-btn"
                                onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                            >
                                <Download size={18} />
                                <span>Download</span>
                                <ChevronDown size={16} className={showDownloadOptions ? 'rotated' : ''} />
                            </button>
                            {showDownloadOptions && (
                                <div className="download-options-dropdown">
                                    <button
                                        className="download-option"
                                        onClick={() => {
                                            onExportCSV();
                                            setShowDownloadOptions(false);
                                        }}
                                    >
                                        <FileSpreadsheet size={16} color="#10b981" />
                                        <span>Export CSV</span>
                                    </button>
                                    <button
                                        className="download-option"
                                        onClick={() => {
                                            onExportPDF();
                                            setShowDownloadOptions(false);
                                        }}
                                    >
                                        <FileText size={16} color="#ef4444" />
                                        <span>Export PDF</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {primaryAction && (
                        <div className="primary-action-wrapper">
                            {primaryAction}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PageHeader;
