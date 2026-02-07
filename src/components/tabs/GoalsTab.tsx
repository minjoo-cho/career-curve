import { useState } from 'react';
import { Target, Calendar, Edit2, History, ChevronDown, ChevronUp, Trash2, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useData } from '@/contexts/DataContext';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CareerGoal } from '@/types/job';

function toDateInputValue(date: Date) {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatKoreanDate(date: Date) {
  const d = new Date(date);
  return `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`;
}

function createBlankGoal(): CareerGoal {
  const now = new Date();
  return {
    id: Date.now().toString(),
    type: 'immediate',
    reason: '',
    searchPeriod: '3개월',
    companyEvalCriteria: [
      { name: '성장 가능성', weight: 5 },
      { name: '기술 스택', weight: 4 },
      { name: '보상', weight: 4 },
      { name: '워라밸', weight: 3 },
      { name: '회사 문화', weight: 4 },
    ],
    startDate: now,
    endDate: undefined,
    createdAt: now,
    updatedAt: now,
  };
}

// Check if goal has content
function hasGoalContent(goal: CareerGoal | null): boolean {
  if (!goal) return false;
  return !!(goal.reason?.trim() || goal.careerPath?.trim() || goal.result?.trim());
}

// Check if goal has endDate set (should be archived)
function isGoalEnded(goal: CareerGoal | null): boolean {
  return !!goal?.endDate;
}

export function GoalsTab() {
  const { currentGoals, addGoal, updateGoal, removeGoal } = useData();
  const [goalHistory, setGoalHistory] = useState<any[]>([]); // Local state for history since not in DB yet
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [pendingNewGoal, setPendingNewGoal] = useState<CareerGoal | null>(null);

  // Filter out goals that have endDate (they should be archived)
  const activeGoals = currentGoals.filter((g) => !isGoalEnded(g));

  const handleAddNewGoal = () => {
    const newGoal = createBlankGoal();
    // 먼저 편집 다이얼로그를 열어 사용자가 저장하면 추가
    setEditingGoalId(newGoal.id);
    setIsAddingNew(true);
    // 바로 추가하지 않고 임시로 저장 - 저장 시에 addGoal 호출
    setPendingNewGoal(newGoal);
  };

  const archiveGoal = (goal: CareerGoal) => {
    setGoalHistory(prev => [...prev, { id: Date.now().toString(), goal, archivedAt: new Date() }]);
  };

  const removeGoalHistory = (id: string) => {
    setGoalHistory(prev => prev.filter(h => h.id !== id));
  };

  const handleArchiveGoal = (goal: CareerGoal) => {
    archiveGoal({ ...goal, endDate: goal.endDate ?? new Date(), updatedAt: new Date() });
    removeGoal(goal.id);
  };

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title="커리어 목표"
        subtitle="목표를 정하고 기록하세요"
        right={
          <Button
            variant="default"
            size="sm"
            onClick={handleAddNewGoal}
          >
            <Target className="w-4 h-4 mr-2" />
            새 목표
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-4 scrollbar-hide">
        {/* Current Goals Cards */}
        <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">현재 목표</h2>
                {activeGoals.length > 0 && (
                  <Badge variant="secondary" className="text-xs">{activeGoals.length}</Badge>
                )}
              </div>
            </div>
          </div>

          {activeGoals.length > 0 ? (
            <div className="divide-y divide-border">
              {activeGoals.map((goal) => {
                const startDate = new Date(goal.startDate);
                const daysSinceStart = Math.floor((new Date().getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <div key={goal.id} className="p-4 space-y-4">
                    {/* Period Badge */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">목표 기간</p>
                          <p className="text-sm font-medium text-foreground">
                            {formatKoreanDate(goal.startDate)}~
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {daysSinceStart}일째
                      </Badge>
                    </div>

                    {/* Reason */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">이직 이유</p>
                      <p className="text-sm text-foreground">{goal.reason || '아직 입력되지 않았습니다'}</p>
                      {goal.careerPath && (
                        <p className="text-xs text-primary">{goal.careerPath}</p>
                      )}
                    </div>

                    {/* Result */}
                    {goal.result && (
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">결과</p>
                        <p className="text-sm text-foreground">{goal.result}</p>
                      </div>
                    )}

                    {/* Company Eval Criteria - Priority Order */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        회사 평가 기준 (우선순위)
                      </p>
                      <div className="space-y-2">
                        {[...goal.companyEvalCriteria]
                          .sort((a, b) => b.weight - a.weight)
                          .map((c, i) => (
                            <div key={i} className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                                  {i + 1}
                                </span>
                                <span className="flex-1 text-foreground">{c.name}</span>
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((n) => (
                                    <div
                                      key={n}
                                      className={cn(
                                        'w-2 h-2 rounded-full',
                                        n <= c.weight ? 'bg-primary' : 'bg-muted'
                                      )}
                                    />
                                  ))}
                                </div>
                              </div>
                              {c.description && (
                                <p className="text-xs text-muted-foreground ml-7">{c.description}</p>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setEditingGoalId(goal.id)}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        수정
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => handleArchiveGoal(goal)}
                      >
                        <History className="w-4 h-4 mr-2" />
                        기록으로
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-muted-foreground text-sm">현재 목표 없음</p>
              <p className="text-xs text-muted-foreground mt-1">새 목표 버튼을 눌러 시작하세요</p>
            </div>
          )}
        </div>

        {/* Goal History */}
        <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
          <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
            <CollapsibleTrigger className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-muted-foreground" />
                <h2 className="font-semibold text-foreground">이전 기록</h2>
                <Badge variant="secondary" className="text-xs">
                  {goalHistory.length}
                </Badge>
              </div>
              {historyOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-3">
                {goalHistory.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    아직 기록이 없습니다
                  </p>
                ) : (
                  goalHistory.map((record) => {
                    const goalStartDate = new Date(record.goal.startDate);
                    const goalEndDate = record.goal.endDate ? new Date(record.goal.endDate) : null;
                    const periodStr = goalEndDate 
                      ? `${formatKoreanDate(goalStartDate)}~${formatKoreanDate(goalEndDate)}`
                      : `${formatKoreanDate(goalStartDate)}~`;
                    
                    return (
                      <div
                        key={record.id}
                        className="bg-secondary/30 rounded-lg p-3 space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {periodStr}
                            </Badge>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7"
                              onClick={() => {
                                addGoal(record.goal);
                                removeGoalHistory(record.id);
                                setEditingGoalId(record.goal.id);
                              }}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-7 h-7 text-destructive hover:text-destructive"
                              onClick={() => removeGoalHistory(record.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        {/* Career Path as main display */}
                        <p className="text-sm font-medium text-foreground">
                          {record.goal.careerPath || '(커리어 패스 없음)'}
                        </p>
                        {/* Result if exists */}
                        {record.goal.result && (
                          <p className="text-xs text-primary">
                            결과: {record.goal.result}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      {/* Goals Edit Dialog */}
      {editingGoalId && (
        <GoalsEditDialog
          open={!!editingGoalId}
          onOpenChange={(open) => {
            if (!open) {
              // If adding new and cancelled, just clear
              if (isAddingNew) {
                setPendingNewGoal(null);
              }
              setEditingGoalId(null);
              setIsAddingNew(false);
            }
          }}
          goal={pendingNewGoal && pendingNewGoal.id === editingGoalId ? pendingNewGoal : currentGoals.find((g) => g.id === editingGoalId)!}
          onSave={(newGoal) => {
            // 새 목표 추가인 경우
            if (isAddingNew && pendingNewGoal) {
              addGoal(newGoal);
              setPendingNewGoal(null);
              setEditingGoalId(null);
              setIsAddingNew(false);
              return;
            }

            // 기존 목표 수정인 경우 - 종료일이 있어도 이전 기록으로 자동 이동하지 않음
            updateGoal(newGoal.id, newGoal);
            setEditingGoalId(null);
            setIsAddingNew(false);
          }}
          onArchive={(goal) => {
            archiveGoal(goal);
            removeGoal(goal.id);
            setHistoryOpen(true);
            setEditingGoalId(null);
            setIsAddingNew(false);
          }}
        />
      )}
    </div>
  );
}

interface GoalsEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: CareerGoal;
  onSave: (goal: CareerGoal) => void;
  onArchive?: (goal: CareerGoal) => void;
}

function GoalsEditDialog({ open, onOpenChange, goal, onSave, onArchive }: GoalsEditDialogProps) {
  const [formData, setFormData] = useState({
    reason: goal.reason,
    careerPath: goal.careerPath || '',
    result: goal.result || '',
    searchPeriod: goal.searchPeriod || '',
    companyEvalCriteria: [...goal.companyEvalCriteria],
    startDate: toDateInputValue(goal.startDate),
    endDate: goal.endDate ? toDateInputValue(goal.endDate) : '',
  });
  const [resultError, setResultError] = useState(false);
  const [showArchiveResult, setShowArchiveResult] = useState(false);
  const [criteriaError, setCriteriaError] = useState(false);

  const updateCriteriaWeight = (index: number, weight: number) => {
    const updated = [...formData.companyEvalCriteria];
    updated[index] = { ...updated[index], weight };
    setFormData({ ...formData, companyEvalCriteria: updated });
  };

  const updateCriteriaName = (index: number, name: string) => {
    const updated = [...formData.companyEvalCriteria];
    updated[index] = { ...updated[index], name };
    setFormData({ ...formData, companyEvalCriteria: updated });
  };

  const updateCriteriaDescription = (index: number, description: string) => {
    const updated = [...formData.companyEvalCriteria];
    updated[index] = { ...updated[index], description };
    setFormData({ ...formData, companyEvalCriteria: updated });
  };

  // Check if at least one company criteria has a name
  const hasValidCriteria = formData.companyEvalCriteria.some(c => c.name.trim() !== '');

  const handleSave = () => {
    // Validate company criteria
    if (!hasValidCriteria) {
      setCriteriaError(true);
      return;
    }
    setCriteriaError(false);

    const startDate = formData.startDate ? new Date(formData.startDate) : new Date();
    const endDate = formData.endDate ? new Date(formData.endDate) : undefined;

    setResultError(false);

    onSave({
      ...goal,
      reason: formData.reason,
      careerPath: formData.careerPath || undefined,
      result: formData.result || undefined,
      searchPeriod: formData.searchPeriod || undefined,
      companyEvalCriteria: formData.companyEvalCriteria.filter(c => c.name.trim() !== ''),
      startDate,
      endDate,
      updatedAt: new Date(),
    });
    onOpenChange(false);
  };

  const handleArchive = () => {
    if (!formData.result.trim()) {
      setResultError(true);
      return;
    }
    setResultError(false);

    const startDate = formData.startDate ? new Date(formData.startDate) : new Date();
    const endDate = formData.endDate ? new Date(formData.endDate) : new Date();

    const archivedGoal: CareerGoal = {
      ...goal,
      reason: formData.reason,
      careerPath: formData.careerPath || undefined,
      result: formData.result,
      searchPeriod: formData.searchPeriod || undefined,
      companyEvalCriteria: formData.companyEvalCriteria.filter(c => c.name.trim() !== ''),
      startDate,
      endDate,
      updatedAt: new Date(),
    };

    onArchive?.(archivedGoal);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90%] max-h-[80vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>커리어 목표 수정</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label>현재 목표 기간</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">시작일</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">목표 종료일 (선택)</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>이직 탐색 기간(선택)</Label>
            <Select
              value={formData.searchPeriod}
              onValueChange={(v) => setFormData({ ...formData, searchPeriod: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="기간 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1개월">1개월</SelectItem>
                <SelectItem value="3개월">3개월</SelectItem>
                <SelectItem value="6개월">6개월</SelectItem>
                <SelectItem value="1년">1년</SelectItem>
                <SelectItem value="상시">상시</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">이직 이유</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="careerPath">커리어 패스</Label>
            <Input
              id="careerPath"
              value={formData.careerPath}
              onChange={(e) => setFormData({ ...formData, careerPath: e.target.value })}
              placeholder="예: 시니어 엔지니어 → 테크 리드"
            />
          </div>


          {/* Company Eval Criteria */}
          <div className="space-y-3">
            <Label className={cn(criteriaError && "text-destructive")}>
              회사 평가 기준 (가중치 클릭으로 조절) <span className="text-destructive">*</span>
            </Label>
            {criteriaError && (
              <p className="text-xs text-destructive">최소 1개 이상의 회사 평가 기준을 입력해주세요.</p>
            )}
            {formData.companyEvalCriteria.map((c, i) => (
              <div key={i} className="space-y-2 p-3 bg-secondary/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Input
                    value={c.name}
                    onChange={(e) => {
                      updateCriteriaName(i, e.target.value);
                      if (e.target.value.trim()) setCriteriaError(false);
                    }}
                    className={cn("flex-1 h-9", criteriaError && i === 0 && !c.name.trim() && "border-destructive")}
                    placeholder="기준 이름"
                  />
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => updateCriteriaWeight(i, n)}
                        className={cn(
                          'w-6 h-6 rounded-full transition-colors',
                          n <= c.weight
                            ? 'bg-primary'
                            : 'bg-muted hover:bg-muted-foreground/20'
                        )}
                      />
                    ))}
                  </div>
                </div>
                <Input
                  value={c.description || ''}
                  onChange={(e) => updateCriteriaDescription(i, e.target.value)}
                  className="h-8 text-xs"
                  placeholder="이 기준이 왜 중요한지 설명해주세요 (선택)"
                />
              </div>
            ))}
          </div>

          {/* Archive Goal Section */}
          {onArchive && (
            <div className="border-t border-border pt-4 space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowArchiveResult(!showArchiveResult)}
              >
                <History className="w-4 h-4 mr-2" />
                목표 종료하기
              </Button>
              
              {showArchiveResult && (
                <div className="space-y-2 p-3 bg-secondary/30 rounded-lg">
                  <Label htmlFor="archiveResult" className={cn(resultError && "text-destructive")}>
                    결과 기록 <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="archiveResult"
                    value={formData.result}
                    onChange={(e) => {
                      setFormData({ ...formData, result: e.target.value });
                      if (e.target.value.trim()) setResultError(false);
                    }}
                    rows={2}
                    placeholder="이 목표의 결과를 기록하세요 (예: A사 입사 확정)"
                    className={cn(resultError && "border-destructive")}
                  />
                  {resultError && (
                    <p className="text-xs text-destructive">결과를 입력해주세요.</p>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full"
                    onClick={handleArchive}
                  >
                    목표 종료 및 기록으로 이동
                  </Button>
                </div>
              )}
            </div>
          )}

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
