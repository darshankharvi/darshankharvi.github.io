window.FileSystem = {
  home: {
    type: 'dir',
    children: {
      about: {
        type: 'dir',
        children: {
          'about.txt': { type: 'file', content: 'About content loading...' }
        }
      },
      projects: {
        type: 'dir',
        children: {
          'projects.txt': { type: 'file', content: 'Projects content loading...' }
        }
      },
      skills: {
        type: 'dir',
        children: {
          'skills.txt': { type: 'file', content: 'Skills content loading...' }
        }
      },
      experience: {
        type: 'dir',
        children: {
          'experience.txt': { type: 'file', content: 'Experience content loading...' }
        }
      },
      education: {
        type: 'dir',
        children: {
          'education.txt': { type: 'file', content: 'Education content loading...' }
        }
      },
      certifications: {
        type: 'dir',
        children: {
          'certifications.txt': { type: 'file', content: 'Certifications content loading...' }
        }
      },
      leadership: {
        type: 'dir',
        children: {
          'leadership.txt': { type: 'file', content: 'Leadership content loading...' }
        }
      },
      contact: {
        type: 'dir',
        children: {
          'contact.txt': { type: 'file', content: 'Contact content loading...' }
        }
      }
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  if (window.ResumeData) {
    window.FileSystem.home.children.about.children['about.txt'].content = window.ResumeData.about;
    window.FileSystem.home.children.projects.children['projects.txt'].content = 
      window.ResumeData.projects.map((p,i) => `[${i+1}] ${p.name}\n${p.details}`).join('\n\n');
    window.FileSystem.home.children.skills.children['skills.txt'].content = 
      window.ResumeData.skills.join(', ');
    window.FileSystem.home.children.experience.children['experience.txt'].content = 
      window.ResumeData.experience.map(e => `${e.role} @ ${e.org} (${e.time})\n${e.desc}`).join('\n\n');
    window.FileSystem.home.children.education.children['education.txt'].content = 
      window.ResumeData.education.map(e => `${e.degree} - ${e.school} (${e.year})`).join('\n');
    window.FileSystem.home.children.certifications.children['certifications.txt'].content = 
      window.ResumeData.certifications.join('\n');
    window.FileSystem.home.children.leadership.children['leadership.txt'].content = 
      window.ResumeData.leadership.join('\n');
    window.FileSystem.home.children.contact.children['contact.txt'].content = 
      `Name: ${window.ResumeData.contact.name}\nPhone: ${window.ResumeData.contact.phone}\nEmail: ${window.ResumeData.contact.email}\nLocation: ${window.ResumeData.contact.location}\nLinkedIn: ${window.ResumeData.contact.linkedin}`;
  }
});
