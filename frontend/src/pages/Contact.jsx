import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import toast from 'react-hot-toast';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    
    if (!formData.email.includes('@')) {
      toast.error('Veuillez entrer une adresse email valide');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate form submission (replace with actual API call)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Message envoyé avec succès ! Nous vous répondrons bientôt.');
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        message: ''
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <Helmet>
        <title>Contact – A KI PRI SA YÉ</title>
        <meta name="description" content="Contactez l'équipe A KI PRI SA YÉ pour toute question, suggestion ou signalement concernant les prix Outre-mer." />
        <meta property="og:title" content="Contact – A KI PRI SA YÉ" />
        <meta property="og:description" content="Envoyez-nous un message pour toute question sur l'application citoyenne de transparence des prix." />
      </Helmet>
      <h1 style={{ color: '#ffffff', marginBottom: '1rem' }}>Contact</h1>
      <p style={{ color: '#b8b8b8', marginBottom: '2rem' }}>
        Vous avez une question ou une suggestion ? N'hésitez pas à nous contacter.
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label htmlFor="name" style={{ display: 'block', color: '#ffffff', marginBottom: '0.5rem' }}>
            Nom
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
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
            value={formData.email}
            onChange={handleChange}
            required
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
            value={formData.message}
            onChange={handleChange}
            required
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
          disabled={isSubmitting}
          style={{
            padding: '0.75rem 1.5rem',
            background: isSubmitting ? '#666' : 'linear-gradient(135deg, #0f62fe, #0353e9)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            fontWeight: '500',
            opacity: isSubmitting ? 0.6 : 1,
          }}
        >
          {isSubmitting ? 'Envoi en cours...' : 'Envoyer'}
        </button>
      </form>
    </div>
  );
}
