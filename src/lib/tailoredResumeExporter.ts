import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { TailoredResume } from '@/types/job';

// Parse markdown-like content and convert to clean text
function parseResumeContent(content: string): { sections: { title: string; items: string[] }[] } {
  const lines = content.split('\n').filter(line => line.trim());
  const sections: { title: string; items: string[] }[] = [];
  let currentSection: { title: string; items: string[] } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check for section headers (## or **)
    if (trimmed.startsWith('## ') || trimmed.startsWith('**') && trimmed.endsWith('**')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      const title = trimmed.replace(/^##\s*/, '').replace(/^\*\*/, '').replace(/\*\*$/, '').trim();
      currentSection = { title, items: [] };
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
      // Bullet points
      const item = trimmed.replace(/^[-•*]\s*/, '').replace(/\*\*/g, '').trim();
      if (currentSection && item) {
        currentSection.items.push(item);
      }
    } else if (trimmed && currentSection) {
      // Regular text - clean markdown formatting
      const cleanText = trimmed.replace(/\*\*/g, '').replace(/##/g, '').trim();
      if (cleanText) {
        currentSection.items.push(cleanText);
      }
    } else if (trimmed && !currentSection) {
      // Text before any section
      currentSection = { title: '', items: [trimmed.replace(/\*\*/g, '').replace(/##/g, '').trim()] };
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return { sections };
}

// Format resume content for clean preview (no markdown)
export function formatResumeForPreview(content: string): string {
  const { sections } = parseResumeContent(content);
  
  return sections.map(section => {
    const lines: string[] = [];
    if (section.title) {
      lines.push(section.title.toUpperCase());
      lines.push('─'.repeat(30));
    }
    section.items.forEach(item => {
      if (item.startsWith('•') || item.startsWith('-')) {
        lines.push(item);
      } else {
        lines.push(`• ${item}`);
      }
    });
    lines.push('');
    return lines.join('\n');
  }).join('\n');
}

export async function exportTailoredResumeToDocx(resume: TailoredResume, userName?: string): Promise<void> {
  const { sections } = parseResumeContent(resume.content);
  const children: Paragraph[] = [];

  // Header - Name
  children.push(
    new Paragraph({
      text: userName || '이름',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    })
  );

  // Target Position subtitle
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `${resume.companyName} - ${resume.jobTitle}`, italics: true, size: 22 }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  // Process each section
  for (const section of sections) {
    if (section.title) {
      children.push(
        new Paragraph({
          text: section.title.toUpperCase(),
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 150 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
          },
        })
      );
    }

    for (const item of section.items) {
      // Check if it looks like a job title (contains | or is bold-like)
      if (item.includes('|') || (item.length < 60 && !item.startsWith('•'))) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: item, bold: true, size: 22 })],
            spacing: { before: 150, after: 50 },
          })
        );
      } else {
        children.push(
          new Paragraph({
            text: item.startsWith('•') ? item : `• ${item}`,
            spacing: { after: 50 },
            indent: { left: 360 },
          })
        );
      }
    }
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  const dateStr = new Date(resume.createdAt).toLocaleDateString('ko-KR', { 
    year: '2-digit', 
    month: '2-digit', 
    day: '2-digit' 
  }).replace(/\. /g, '.').replace(/\.$/, '');
  
  const fileName = `${resume.companyName}_${dateStr}_resume.docx`;
  saveAs(blob, fileName);
}
