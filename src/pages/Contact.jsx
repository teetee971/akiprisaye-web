import React from 'react';

export default function Contact() {
  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ color: '#ffffff', marginBottom: '1rem' }}>Contact</h1>
      <p style={{ color: '#b8b8b8', marginBottom: '2rem' }}>
        Vous avez une question ou une suggestion ? N'hésitez pas à nous contacter.
      </p>
      <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label htmlFor="name" style={{ display: 'block', color: '#ffffff', marginBottom: '0.5rem' }}>
            Nom
          </label>
          <input
            type="text"
            id="name"
            name="name"
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #2a2d3e',
              background: '#1a1d2e',
              color: '#ffffff',
            }}
          />
        </div>
        <div>
          <label htmlFor="email" style={{ display: 'block', color: '#ffffff', marginBottom: '0.5rem' }}>
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #2a2d3e',
              background: '#1a1d2e',
              color: '#ffffff',
            }}
          />
        </div>
        <div>
          <label htmlFor="message" style={{ display: 'block', color: '#ffffff', marginBottom: '0.5rem' }}>
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows="5"
            style={{
              width: '100%',
              padding: '0.5rem',
              borderRadius: '4px',
              border: '1px solid #2a2d3e',
              background: '#1a1d2e',
              color: '#ffffff',
            }}
          ></textarea>
        </div>
        <button
          type="submit"
          style={{
            padding: '0.75rem 1.5rem',
            background: 'linear-gradient(135deg, #0f62fe, #0353e9)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: '500',
          }}
        >
          Envoyer
        </button>
      </form>
    </div>
  );
}
