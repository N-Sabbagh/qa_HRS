import React, { useState } from 'react';
import axios from 'axios';

function SpaReservationPage() {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    treatmentType: '',
    contactDetails: ''
  });
  const [errorMessages, setErrorMessages] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name) errors.name = 'Name is required.';
    if (!formData.date) {
      errors.date = 'Date is required.';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        errors.date = 'Date cannot be in the past.';
      }
    }
    if (!formData.time) {
      errors.time = 'Time is required.';
    } else {
      const selectedTime = formData.time;
      const validTimeRanges = [
        { start: '06:00', end: '09:00' },
        { start: '12:00', end: '14:00' },
        { start: '16:00', end: '20:00' }
      ];
      const isValidTime = validTimeRanges.some(range => selectedTime >= range.start && selectedTime <= range.end);
      if (!isValidTime) {
        errors.time = 'Time must be within the available slots: 06:00-09:00, 12:00-14:00, or 16:00-20:00.';
      }
    }
    if (!formData.treatmentType) errors.treatmentType = 'Treatment type is required.';
    if (!formData.contactDetails) errors.contactDetails = 'Contact details are required.';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessages({});
    setSuccessMessage('');

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setErrorMessages(errors);
      return;
    }

    try {
      const response = await axios.post('/book-spa', formData);
      setSuccessMessage('Booking successful. Click OK to continue.');
      setFormData({
        name: '',
        date: '',
        time: '',
        treatmentType: '',
        contactDetails: ''
      });
    } catch (error) {
      setErrorMessages({ general: error.response?.data || 'Failed to book spa.' });
    }
  };

  return (
    <div className="booking-page" style={{ padding: '0 10vw' }}>
      <h2 className="center-text">Book a Spa Appointment</h2>
      <form onSubmit={handleSubmit}>
        {/* Name */}
        <div className="form-group">
          <label>
            Name <span className="red-text">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={`form-control ${errorMessages.name ? 'input-error' : ''}`}
            required
          />
          {errorMessages.name && (
            <div className="error-message">{errorMessages.name}</div>
          )}
        </div>

        {/* Date */}
        <div className="form-group">
          <label>
            Date <span className="red-text">*</span>
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className={`form-control ${errorMessages.date ? 'input-error' : ''}`}
            required
          />
          {errorMessages.date && (
            <div className="error-message">{errorMessages.date}</div>
          )}
        </div>

        {/* Time */}
        <div className="form-group">
          <label>
            Time <span className="red-text">*</span>
          </label>
          <input
            type="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            className={`form-control ${errorMessages.time ? 'input-error' : ''}`}
            required
          />
          {errorMessages.time && (
            <div className="error-message">{errorMessages.time}</div>
          )}
        </div>

        {/* Treatment Type */}
        <div className="form-group">
          <label>
            Treatment Type <span className="red-text">*</span>
          </label>
          <select
            name="treatmentType"
            value={formData.treatmentType}
            onChange={handleChange}
            className={`form-control ${errorMessages.treatmentType ? 'input-error' : ''}`}
            required
          >
            <option value="">Select Treatment</option>
            <option value="Jacuzzi">Jacuzzi</option>
            <option value="Pool">Pool</option>
            <option value="Both">Both</option>
          </select>
          {errorMessages.treatmentType && (
            <div className="error-message">{errorMessages.treatmentType}</div>
          )}
        </div>

        {/* Contact Details */}
        <div className="form-group">
          <label>
            Contact Details <span className="red-text">*</span>
          </label>
          <input
            type="text"
            name="contactDetails"
            value={formData.contactDetails}
            onChange={handleChange}
            className={`form-control ${errorMessages.contactDetails ? 'input-error' : ''}`}
            required
          />
          {errorMessages.contactDetails && (
            <div className="error-message">{errorMessages.contactDetails}</div>
          )}
        </div>

        {/* Submit Button */}
        {errorMessages.general && (
          <div className="error-message">{errorMessages.general}</div>
        )}
        {successMessage && (
          <div className="success-message">{successMessage}</div>
        )}
        <button type="submit" className="btn-submit btn-blue">
          Book Now
        </button>
      </form>
    </div>
  );
}

export default SpaReservationPage;