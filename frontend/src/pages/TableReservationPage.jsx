// TableReservationPage.jsx
import React, { useState } from 'react';
import axios from 'axios';

function TableReservationPage() {
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    time: '',
    numberOfGuests: '',
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
    if (!formData.date) errors.date = 'Date is required.';
    if (!formData.time) {
      errors.time = 'Time is required.';
    } else {
      const selectedTime = formData.time;
      const startTime = '06:00';
      const endTime = '22:00';
      if (selectedTime < startTime || selectedTime > endTime) {
        errors.time = 'Time must be between 06:00 and 22:00.';
      }
    }
    if (!formData.numberOfGuests || formData.numberOfGuests <= 0) errors.numberOfGuests = 'Number of guests must be greater than 0.';
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
      const response = await axios.post('/reserve-table', formData);
      setSuccessMessage('Reservation successful. Click OK to continue.');
      setFormData({
        name: '',
        date: '',
        time: '',
        numberOfGuests: '',
        contactDetails: ''
      });
    } catch (error) {
      setErrorMessages({ general: error.response?.data || 'Failed to reserve table.' });
    }
  };

  return (
    <div className="reservation-page" style={{ padding: '0 10vw' }}>
      <h2 className="center-text">Reserve a Table</h2>
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

        {/* Number of Guests */}
        <div className="form-group">
          <label>
            Number of Guests <span className="red-text">*</span>
          </label>
          <input
            type="number"
            name="numberOfGuests"
            value={formData.numberOfGuests}
            onChange={handleChange}
            className={`form-control ${errorMessages.numberOfGuests ? 'input-error' : ''}`}
            required
          />
          {errorMessages.numberOfGuests && (
            <div className="error-message">{errorMessages.numberOfGuests}</div>
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
          Reserve Now
        </button>
      </form>
    </div>
  );
}

export default TableReservationPage;