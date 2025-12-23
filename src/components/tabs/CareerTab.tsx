import { useState, useRef } from 'react';
import { Plus, FileText, Upload, Trash2, Edit2, ChevronDown, ChevronUp, File, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useJobStore } from '@/stores/jobStore';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { Experience, Resume } from '@/types/job';

export function CareerTab() {
  const { experiences, resumes, addExperience, updateExperience, removeExperience, addResume, removeResume } = useJobStore();
  const [resumesOpen, setResumesOpen] = useState(true);
  const [experienceOpen, setExperienceOpen] = useState(true);
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [editingExperience, setEditingExperience] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      toast.error('PDF 파일만 업로드 가능합니다');
      return;
    }

    setIsUploading(true);

    // Simulate upload - in real implementation, upload to Supabase Storage
    try {
      // For now, create a local URL
      const fileUrl = URL.createObjectURL(file);
      
      const newResume: Resume = {
        id: Date.now().toString(),
        fileName: file.name,
        fileUrl: fileUrl,
        uploadedAt: new Date(),
        parseStatus: 'pending',
      };

      addResume(newResume);
      toast.success('이력서가 업로드되었습니다');

      // TODO: Trigger AI parsing
      // In real implementation, call edge function to parse resume
    } catch (error) {
      toast.error('업로드 실패. 다시 시도해주세요.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col h-full">
      <header className="px-4 pt-safe-top pb-4 bg-background safe-top">
        <h1 className="text-xl font-bold text-foreground">경력</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          이력서와 경험을 관리하세요
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-4 scrollbar-hide">
        {/* Resumes Section */}
        <Collapsible open={resumesOpen} onOpenChange={setResumesOpen}>
          <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
            <CollapsibleTrigger className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <File className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">이력서</h2>
                <Badge variant="secondary" className="text-xs">{resumes.length}</Badge>
              </div>
              {resumesOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-3">
                {/* Hidden file input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Upload Resume Button */}
                <Button 
                  variant="outline" 
                  className="w-full border-dashed"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  이력서 업로드 (PDF)
                </Button>

                {/* Resume Cards */}
                {resumes.map((resume) => (
                  <div key={resume.id} className="bg-secondary/30 rounded-lg p-3 group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <File className="w-4 h-4 text-primary shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {resume.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {resume.uploadedAt.toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={resume.parseStatus === 'success' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {resume.parseStatus === 'pending' && '분석 중'}
                          {resume.parseStatus === 'success' && '완료'}
                          {resume.parseStatus === 'fail' && '실패'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-7 h-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeResume(resume.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {resumes.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    아직 업로드된 이력서가 없습니다
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Experiences Section */}
        <Collapsible open={experienceOpen} onOpenChange={setExperienceOpen}>
          <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
            <CollapsibleTrigger className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">경험</h2>
                <Badge variant="secondary" className="text-xs">{experiences.length}</Badge>
              </div>
              {experienceOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-3">
                {/* Experience Cards */}
                {experiences.map((exp) => (
                  <div key={exp.id} className="bg-secondary/30 rounded-lg p-3 group">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-sm text-foreground">{exp.title}</h3>
                        {exp.company && <p className="text-xs text-muted-foreground">{exp.company}</p>}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-7 h-7"
                          onClick={() => setEditingExperience(exp.id)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-7 h-7 text-destructive hover:text-destructive"
                          onClick={() => removeExperience(exp.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {exp.bullets.slice(0, 3).map((bullet, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-primary">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                    {exp.usedInPostings.length > 0 && (
                      <Badge variant="secondary" className="text-xs mt-2">
                        {exp.usedInPostings.length}개 공고에 사용됨
                      </Badge>
                    )}
                  </div>
                ))}

                {/* Add Experience Button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setIsAddingExperience(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  경험 추가
                </Button>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      {/* Experience Add/Edit Dialog */}
      <ExperienceDialog
        open={isAddingExperience || !!editingExperience}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingExperience(false);
            setEditingExperience(null);
          }
        }}
        experience={editingExperience ? experiences.find(e => e.id === editingExperience) : undefined}
        onSave={(exp) => {
          if (editingExperience) {
            updateExperience(editingExperience, exp);
          } else {
            addExperience({ 
              id: Date.now().toString(), 
              title: exp.title,
              company: exp.company,
              description: exp.description,
              bullets: exp.bullets,
              usedInPostings: exp.usedInPostings,
              createdAt: new Date() 
            });
          }
          setIsAddingExperience(false);
          setEditingExperience(null);
        }}
      />
    </div>
  );
}

interface ExperienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experience?: Experience;
  onSave: (exp: Omit<Experience, 'id' | 'createdAt'>) => void;
}

function ExperienceDialog({ open, onOpenChange, experience, onSave }: ExperienceDialogProps) {
  const [formData, setFormData] = useState({
    title: experience?.title || '',
    company: experience?.company || '',
    description: experience?.description || '',
    bullets: experience?.bullets.join('\n') || '',
    usedInPostings: experience?.usedInPostings || [],
  });

  const handleSave = () => {
    onSave({
      title: formData.title,
      company: formData.company || undefined,
      description: formData.description,
      bullets: formData.bullets.split('\n').filter(b => b.trim()),
      usedInPostings: formData.usedInPostings,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90%] rounded-2xl">
        <DialogHeader>
          <DialogTitle>{experience ? '경험 수정' : '경험 추가'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="expTitle">제목</Label>
            <Input
              id="expTitle"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="예: 시니어 프론트엔드 개발자"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expCompany">회사</Label>
            <Input
              id="expCompany"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="예: 스타트업 ABC"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expDesc">설명</Label>
            <Input
              id="expDesc"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="역할에 대한 간단한 설명"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expBullets">주요 성과 (줄바꿈으로 구분)</Label>
            <Textarea
              id="expBullets"
              value={formData.bullets}
              onChange={(e) => setFormData({ ...formData, bullets: e.target.value })}
              placeholder="• MAU 50만 서비스 개발&#10;• 성능 30% 개선"
              rows={4}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
