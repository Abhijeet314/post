import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Interface for ideas type
interface Idea {
  id: string;
  content: string;
  imageUrl?: string;
  platform?: string;
  week?: number;
  day?: string;
  type?: string;
  generatedContent?: string;
}

// Type for RGB color
type RGB = [number, number, number];

/**
 * Add a professional-looking cover page to the PDF
 */
function addCoverPage(doc: jsPDF, title: string, subtitle: string = '') {
  doc.addPage();
  doc.movePage(doc.getNumberOfPages(), 1); // Move the new page to be the first page
  
  // Set brand color
  const BRAND_COLOR: RGB = [41, 82, 163]; // Blue
  const ACCENT_COLOR: RGB = [63, 131, 248]; // Lighter blue
  
  // Add background gradient
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Cover page background
  doc.setDrawColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
  doc.setFillColor(BRAND_COLOR[0], BRAND_COLOR[1], BRAND_COLOR[2]);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  // Add accent design elements
  doc.setFillColor(ACCENT_COLOR[0], ACCENT_COLOR[1], ACCENT_COLOR[2]);
  doc.rect(0, pageHeight - 40, pageWidth, 40, 'F');
  
  // Add title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  
  // Wrap title if needed
  const titleLines = doc.splitTextToSize(title, 170);
  const titleY = 100;
  doc.text(titleLines, pageWidth / 2, titleY, { align: 'center' });
  
  // Add date
  const today = new Date().toLocaleDateString();
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on ${today}`, pageWidth / 2, titleY + (titleLines.length * 12) + 20, { align: 'center' });
  
  // Add subtitle if provided
  if (subtitle) {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'italic');
    doc.text(subtitle, pageWidth / 2, titleY + (titleLines.length * 12) + 40, { align: 'center' });
  }
  
  // Add logo/branding
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('JustPost', pageWidth / 2, 40, { align: 'center' });
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Strategic Content Planner', pageWidth / 2, 52, { align: 'center' });
  
  // Add footer
  doc.setFontSize(10);
  doc.text('Created with JustPost | www.justpost.com', pageWidth / 2, pageHeight - 20, { align: 'center' });
  
  return doc;
}

/**
 * Export ideas to PDF with a nicer visual format
 */
export const exportToPDF = (ideas: Idea[], title: string = 'Generated Content Ideas') => {
  const doc = new jsPDF();
  
  // Set document properties
  doc.setProperties({
    title: title,
    subject: 'Content Ideas',
    author: 'JustPost',
    creator: 'JustPost App'
  });
  
  // Check if we have a marketing plan structure (ideas with week and day)
  const hasMarketingPlanStructure = ideas.some(idea => idea.week && idea.day);
  
  // Add a subtitle based on the content type
  let subtitle = '';
  if (hasMarketingPlanStructure) {
    subtitle = 'Comprehensive Marketing Strategy';
  } else {
    // Get common platform if available
    const platforms = [...new Set(ideas.map(idea => idea.platform).filter(Boolean))];
    if (platforms.length === 1) {
      subtitle = `${platforms[0]} Content Ideas`;
    } else {
      subtitle = 'Social Media Content Ideas';
    }
  }
  
  // Add cover page
  addCoverPage(doc, title, subtitle);
  
  // Add intro section on the second page
  doc.addPage();
  doc.setFontSize(20);
  doc.setTextColor(41, 82, 163);
  doc.text('Content Overview', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.text('This document contains your strategic content plan with ideas and generated content.', 20, 38);
  
  // Add overview table with statistics
  const stats = {
    totalIdeas: ideas.length,
    withGeneratedContent: ideas.filter(idea => idea.generatedContent).length,
    withImages: ideas.filter(idea => idea.imageUrl).length,
    platforms: [...new Set(ideas.map(idea => idea.platform).filter(Boolean))]
  };
  
  doc.setFontSize(14);
  doc.setTextColor(60, 60, 60);
  doc.text('Document Statistics', 20, 50);
  
  autoTable(doc, {
    startY: 55,
    head: [['Metric', 'Value']],
    body: [
      ['Total Content Items', stats.totalIdeas.toString()],
      ['With Generated Content', stats.withGeneratedContent.toString()],
      ['With Images', stats.withImages.toString()],
      ['Platforms', stats.platforms.length > 0 ? stats.platforms.join(', ') : 'All platforms']
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [41, 82, 163],
      textColor: [255, 255, 255]
    },
    columnStyles: {
      0: { cellWidth: 80 }
    },
    styles: {
      cellPadding: 5
    }
  });
  
  if (hasMarketingPlanStructure) {
    // Get unique weeks
    const weeks = [...new Set(ideas.map(idea => idea.week).filter(Boolean))].sort();
    
    let yPosition = 120;
    
    // For each week
    weeks.forEach(week => {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
      
      // Add week header
      doc.setFillColor(41, 82, 163);
      doc.rect(20, yPosition, 170, 10, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Week ${week}`, 105, yPosition + 7, { align: 'center' });
      
      yPosition += 15;
      
      // Get days for this week
      const weekIdeas = ideas.filter(idea => idea.week === week);
      const days = [...new Set(weekIdeas.map(idea => idea.day).filter(Boolean))];
      
      // For each day
      days.forEach(day => {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Add day header
        doc.setFillColor(230, 236, 245);
        doc.rect(20, yPosition, 170, 8, 'F');
        doc.setTextColor(41, 82, 163);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`${day}`, 25, yPosition + 6);
        
        yPosition += 12;
        
        // Get ideas for this day
        const dayIdeas = weekIdeas.filter(idea => idea.day === day);
        
        // For each idea
        dayIdeas.forEach(idea => {
          // Check if we need a new page
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 20;
          }
          
          // Add idea title or type
          doc.setTextColor(60, 60, 60);
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          
          const ideaTitle = idea.type || 'Content Idea';
          const platformText = idea.platform ? ` (${idea.platform})` : '';
          
          doc.text(`${ideaTitle}${platformText}`, 25, yPosition);
          
          yPosition += 6;
          
          // Add the content
          doc.setTextColor(80, 80, 80);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
          
          // Text wrapping for content
          const contentLines = doc.splitTextToSize(idea.content, 160);
          doc.text(contentLines, 25, yPosition);
          
          yPosition += (contentLines.length * 5) + 2;
          
          // Add generated content if available
          if (idea.generatedContent) {
            // Check if we need a new page
            if (yPosition > 240) {
              doc.addPage();
              yPosition = 20;
            }
            
            doc.setTextColor(100, 100, 100);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'italic');
            doc.text('Generated Content:', 30, yPosition);
            
            yPosition += 5;
            
            doc.setTextColor(80, 80, 80);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            
            // Text wrapping for generated content
            const generatedLines = doc.splitTextToSize(idea.generatedContent, 155);
            doc.text(generatedLines, 35, yPosition);
            
            yPosition += (generatedLines.length * 4.5) + 5;
          }
          
          // Add image if available
          if (idea.imageUrl && idea.imageUrl.startsWith('data:')) {
            try {
              // Check if we need a new page
              if (yPosition > 180) {
                doc.addPage();
                yPosition = 20;
              }
              
              const imgWidth = 120;
              const imgHeight = 80;
              doc.addImage(idea.imageUrl, 'PNG', 30, yPosition, imgWidth, imgHeight);
              
              yPosition += imgHeight + 10;
            } catch (error) {
              console.error('Error adding image to PDF:', error);
              doc.text('Error loading image', 30, yPosition);
              yPosition += 10;
            }
          }
          
          // Add a divider
          doc.setDrawColor(220, 220, 220);
          doc.line(25, yPosition, 185, yPosition);
          
          yPosition += 10;
        });
      });
    });
  } else {
    // Standard table-based export for simple ideas list
    doc.addPage();
    
    // Add a section title
    doc.setFontSize(16);
    doc.setTextColor(41, 82, 163);
    doc.text('Content Ideas', 105, 20, { align: 'center' });
    
    // Prepare data for the table
    const tableRows = ideas.map((idea, index) => [
      (index + 1).toString(),
      idea.content,
      idea.platform || 'All platforms'
    ]);
    
    // Add table with ideas
    autoTable(doc, {
      head: [['#', 'Content', 'Platform']],
      body: tableRows,
      startY: 30,
      headStyles: {
        fillColor: [41, 82, 163],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 'auto' }
      },
      styles: {
        overflow: 'linebreak',
        cellPadding: 5
      },
      theme: 'grid'
    });
    
    // If there are images, add them on new pages
    ideas.forEach((idea, index) => {
      if (idea.imageUrl) {
        // Add a new page for each image
        doc.addPage();
        
        // Add idea number and content as title
        doc.setFontSize(14);
        doc.setTextColor(41, 82, 163);
        doc.text(`Idea #${index + 1}`, 105, 20, { align: 'center' });
        
        // Add the content
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.text(idea.content, 20, 30, { 
          maxWidth: 170, 
          align: 'left' 
        });
        
        // Add image if it's a data URL
        if (idea.imageUrl && idea.imageUrl.startsWith('data:')) {
          try {
            const imgWidth = 160;
            const imgHeight = 100;
            doc.addImage(idea.imageUrl, 'PNG', 20, 40, imgWidth, imgHeight);
            doc.text('Generated Image', 105, 150, { align: 'center' });
          } catch (error) {
            console.error('Error adding image to PDF:', error);
            doc.text('Error loading image', 105, 100, { align: 'center' });
          }
        }
      }
    });
  }
  
  // Add a footer with page numbers
  const pageCount = doc.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`JustPost | Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
  }
  
  // Save the PDF
  const today = new Date().toLocaleDateString();
  doc.save(`${title.toLowerCase().replace(/\s+/g, '_')}_${today.replace(/\//g, '-')}.pdf`);
};

/**
 * Export ideas to JSON file
 */
export const exportToJSON = (ideas: Idea[], title: string = 'Generated Content Ideas') => {
  // Format the data
  const exportData = {
    title,
    generatedOn: new Date().toISOString(),
    ideas: ideas.map(idea => ({
      content: idea.content,
      platform: idea.platform || 'All platforms',
      hasImage: !!idea.imageUrl,
      week: idea.week,
      day: idea.day,
      type: idea.type,
      generatedContent: idea.generatedContent
    }))
  };
  
  // Convert to JSON string
  const jsonString = JSON.stringify(exportData, null, 2);
  
  // Create a blob
  const blob = new Blob([jsonString], { type: 'application/json' });
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
};

/**
 * Export ideas to plain text
 */
export const exportToText = (ideas: Idea[], title: string = 'Generated Content Ideas') => {
  // Create header
  let text = `${title}\n`;
  text += `Generated on ${new Date().toLocaleDateString()}\n\n`;
  
  // Check if we have a marketing plan structure
  const hasMarketingPlanStructure = ideas.some(idea => idea.week && idea.day);
  
  if (hasMarketingPlanStructure) {
    // Get unique weeks
    const weeks = [...new Set(ideas.map(idea => idea.week).filter(Boolean))].sort();
    
    // For each week
    weeks.forEach(week => {
      text += `============ WEEK ${week} ============\n\n`;
      
      // Get days for this week
      const weekIdeas = ideas.filter(idea => idea.week === week);
      const days = [...new Set(weekIdeas.map(idea => idea.day).filter(Boolean))];
      
      // For each day
      days.forEach(day => {
        text += `---------- ${day} ----------\n\n`;
        
        // Get ideas for this day
        const dayIdeas = weekIdeas.filter(idea => idea.day === day);
        
        // For each idea
        dayIdeas.forEach(idea => {
          // Add idea title or type
          const ideaTitle = idea.type || 'Content Idea';
          const platformText = idea.platform ? ` (${idea.platform})` : '';
          
          text += `${ideaTitle}${platformText}\n`;
          text += `${idea.content}\n\n`;
          
          if (idea.generatedContent) {
            text += `Generated Content:\n`;
            text += `${idea.generatedContent}\n\n`;
          }
          
          if (idea.imageUrl) {
            text += `[This idea includes an image that can't be displayed in text format]\n\n`;
          }
          
          text += `------------------------\n\n`;
        });
      });
    });
  } else {
    // Standard format for simple ideas list
    ideas.forEach((idea, index) => {
      text += `Idea #${index + 1}: ${idea.content}\n`;
      text += `Platform: ${idea.platform || 'All platforms'}\n`;
      
      if (idea.generatedContent) {
        text += `Generated Content: ${idea.generatedContent}\n`;
      }
      
      if (idea.imageUrl) {
        text += `[This idea includes an image that can't be displayed in text format]\n`;
      }
      
      text += '\n';
    });
  }
  
  // Create a blob
  const blob = new Blob([text], { type: 'text/plain' });
  
  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toLocaleDateString().replace(/\//g, '-')}.txt`;
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}; 