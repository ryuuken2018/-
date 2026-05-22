import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, User, Lock, X, RefreshCw, HelpCircle, Check, KeyRound } from 'lucide-react';
import { getActiveRole, setActiveRole, getParentPassword, setParentPassword, ClassroomRole } from '../lib/roleStore';

export const ParentControlPanel: React.FC = () => {
  const [activeRole, setActiveRoleState] = useState<ClassroomRole>('parent');
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Math quiz state for default parent lock
  const [mathQuiz, setMathQuiz] = useState({ q: '', a: 0 });
  const [userMathAnswer, setUserMathAnswer] = useState('');
  const [pinInput, setPinInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Settings pane state
  const [newPin, setNewPin] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Sync role and password
  const loadCurrentState = () => {
    setActiveRoleState(getActiveRole());
  };

  useEffect(() => {
    loadCurrentState();
    window.addEventListener('classroom-role-changed', loadCurrentState);
    return () => {
      window.removeEventListener('classroom-role-changed', loadCurrentState);
    };
  }, []);

  // Generate a random arithmetic puzzle to prevent kids
  const generateMathQuiz = () => {
    const num1 = Math.floor(Math.random() * 12) + 6; // 6 to 17
    const num2 = Math.floor(Math.random() * 12) + 6; // 6 to 17
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    
    let q = '';
    let a = 0;
    if (op === '+') {
      q = `${num1} 加 ${num2} 等于多少？`;
      a = num1 + num2;
    } else if (op === '-') {
      const max = Math.max(num1, num2);
      const min = Math.min(num1, num2);
      q = `${max} 减 ${min} 等于多少？`;
      a = max - min;
    } else {
      const small1 = Math.floor(Math.random() * 7) + 3; // 3 to 9
      const small2 = Math.floor(Math.random() * 7) + 3; // 3 to 9
      q = `${small1} 乘以 ${small2} 等于多少？`;
      a = small1 * small2;
    }

    setMathQuiz({ q, a });
    setUserMathAnswer('');
    setPinInput('');
    setErrorMsg('');
  };

  // Switch to Student is immediate
  const handleSwitchToStudent = () => {
    setActiveRole('student');
    setActiveRoleState('student');
  };

  // Switch to Parent starts verification
  const handleInitiateParentSwitch = () => {
    if (activeRole === 'parent') {
      // Already parent, allow opening parental configs
      setShowSettingsModal(true);
      return;
    }
    // Set up security check
    generateMathQuiz();
    setShowUnlockModal(true);
  };

  // Perform Parental Lock Verification
  const handleVerifyUnlock = () => {
    const savedPin = getParentPassword();

    if (savedPin) {
      // Verify via custom PIN
      if (pinInput.trim() === savedPin) {
        setActiveRole('parent');
        setActiveRoleState('parent');
        setShowUnlockModal(false);
      } else {
        setErrorMsg('❌ 密码不正确，请重新输入！');
      }
    } else {
      // Verify via Math Quiz
      const val = parseInt(userMathAnswer.trim(), 10);
      if (!isNaN(val) && val === mathQuiz.a) {
        setActiveRole('parent');
        setActiveRoleState('parent');
        setShowUnlockModal(false);
      } else {
        setErrorMsg('❌ 答案算错啦，证明你还是一个聪明的小朋友，请让老师或家长来作答吧！');
      }
    }
  };

  // Save new custom PIN code
  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    setParentPassword(newPin.trim());
    setSuccessMsg('✅ 家长专属密码设置成功！已保存在本地，下次切换将使用该密码。');
    setNewPin('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const handleClearPin = () => {
    setParentPassword('');
    setSuccessMsg('✅ 已清除家长密码，后续将恢复为随机数学乘加算术验证。');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <>
      {/* Persistent global top bar for control status */}
      <div className="w-full bg-stone-900 text-stone-100 py-2.5 px-4 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Active Mode indicator / logo area */}
          <div className="flex items-center gap-2">
            <span className="text-lg">🎒</span>
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-extrabold text-xs tracking-wider text-stone-200">
                当前教室模式：
              </span>
              <div className="flex items-center gap-1.5">
                {activeRole === 'parent' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500 text-stone-950 shadow-inner">
                    <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>家长与教师模式 (全面启用 🔑)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500 text-stone-950 shadow-inner">
                    <User className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>学生自助模式 (点赞被禁用 🎒)</span>
                  </span>
                )}
              </div>
            </div>
            
            <p className="text-[10px] text-stone-400 hidden lg:block font-medium ml-2">
              (提示：课堂表现奖励分、放归、删除宠物必须在家长模式下操作。喂食、玩耍、休息、装扮正常开放)
            </p>
          </div>

          {/* Quick role actions */}
          <div className="flex items-center gap-2">
            {activeRole === 'student' ? (
              <button
                onClick={handleInitiateParentSwitch}
                className="px-3.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center gap-1 transition-all shadow-md active:translate-y-0.5 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>切到【家长/教师模式】</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="px-2.5 py-1 rounded-lg bg-stone-850 hover:bg-stone-800 text-stone-300 border border-stone-700 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  title="家长管理中心"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>管理密码</span>
                </button>
                <button
                  onClick={handleSwitchToStudent}
                  className="px-3.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs flex items-center gap-1 transition-all shadow-md active:translate-y-0.5 cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>切到【学生自助模式】</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unlock Dialog (Children Pin / Math validation) */}
      <AnimatePresence>
        {showUnlockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card w-full max-w-sm border-3 border-stone-800 rounded-2xl p-6 relative shadow-2xl"
            >
              <button
                onClick={() => setShowUnlockModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted text-foreground/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 stroke-[2.5]" />
                </div>
                <h3 className="text-lg font-black text-foreground">
                  家长与教师模式验证
                </h3>
                <p className="text-xs text-foreground/60 font-bold mt-1 max-w-[280px]">
                  为了防止小朋友调皮刷高经验分，我们需要进行安全验证。
                </p>

                <div className="w-full my-5 p-4 rounded-xl bg-orange-50/50 border border-orange-200">
                  {getParentPassword() ? (
                    // Render custom pin lock challenge
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-black text-stone-700">🔒 请输入家长专用 4 位开锁密码：</span>
                      <input
                        type="password"
                        placeholder="请输入数字或字符密码"
                        value={pinInput}
                        onChange={(e) => setPinInput(e.target.value)}
                        className="w-full text-center tracking-widest text-lg bg-background border-2 border-border/80 rounded-lg p-2 font-black outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleVerifyUnlock();
                        }}
                        autoFocus
                      />
                    </div>
                  ) : (
                    // Render math challenge
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-amber-800">🧮 口算乘除加减法(防作弊):</span>
                        <button 
                          onClick={generateMathQuiz}
                          className="text-[10px] text-amber-600 flex items-center gap-0.5 hover:underline"
                        >
                          <RefreshCw className="w-2.5 h-2.5" /> 换一题
                        </button>
                      </div>
                      <span className="text-base font-black text-stone-850 my-1 py-1 block bg-white rounded-lg border border-orange-100">
                        {mathQuiz.q}
                      </span>
                      <input
                        type="number"
                        placeholder="小朋友，算下结果填这里哦"
                        value={userMathAnswer}
                        onChange={(e) => setUserMathAnswer(e.target.value)}
                        className="w-full text-center bg-background border-2 border-border/80 rounded-lg p-2 font-black outline-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleVerifyUnlock();
                        }}
                        autoFocus
                      />
                    </div>
                  )}

                  {errorMsg && (
                    <p className="text-[11px] font-bold text-rose-500 mt-2 bg-rose-50 px-2 py-1 rounded border border-rose-200 text-left">
                      {errorMsg}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3.5 w-full">
                  <button
                    onClick={() => setShowUnlockModal(false)}
                    className="btn-push-white py-2.5 text-xs"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleVerifyUnlock}
                    className="btn-push py-2.5 text-xs text-stone-950 font-black"
                  >
                    解锁
                  </button>
                </div>

                <div className="text-[10px] text-foreground/40 mt-3 flex items-center gap-1 select-none">
                  <HelpCircle className="w-3 h-3" />
                  <span>提示：默认无密码时使用动态算术题进行验证</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Settings Modal (Set custom pin) */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/85">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card w-full max-w-md border-3 border-stone-800 rounded-2xl p-6 relative shadow-2xl"
            >
              <button
                onClick={() => setShowSettingsModal(false)}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted text-foreground/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col">
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-dashed border-border">
                  <KeyRound className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-black text-foreground">
                    ⚙️ 家长控制中心与密码设置
                  </h3>
                </div>

                <div className="flex flex-col gap-4 text-xs">
                  <div>
                    <h4 className="font-extrabold text-foreground mb-1.5">权限分配一览：</h4>
                    <div className="bg-muted p-3.5 rounded-xl border border-border/40 flex flex-col gap-1.5 leading-relaxed font-semibold text-foreground/75">
                      <p className="flex items-center gap-1">
                        <span className="text-emerald-500">🟢</span> 
                        <span><strong>萌宠日常：</strong>喂食、玩耍、休息、换装 ➔ <strong>家长学生皆可操作</strong></span>
                      </p>
                      <p className="flex items-center gap-1">
                        <span className="text-purple-500">🟣</span> 
                        <span><strong>花草园游玩：</strong>散步、防雨、逗乐 ➔ <strong>家长学生皆可操作</strong></span>
                      </p>
                      <p className="flex items-center gap-1">
                        <span className="text-rose-500">🔴</span> 
                        <span><strong>课堂表现奖励：</strong>点赞、加经验记功 ➔ <strong className="text-rose-600 underline">防刷单，仅家长模式可用</strong></span>
                      </p>
                      <p className="flex items-center gap-1 text-[11px] text-foreground/50 border-t border-dashed border-border/80 pt-1.5 mt-1">
                        🔒 提示：放归和删除宠物操作也仅可在家长端操作，安全十足。
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSavePin} className="flex flex-col gap-2.5 pt-2">
                    <h4 className="font-extrabold text-foreground flex items-center justify-between">
                      <span>锁屏密码设定 (PIN Code Setting):</span>
                      {getParentPassword() ? (
                        <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded">
                          已启用独立密码
                        </span>
                      ) : (
                        <span className="text-[10px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                          目前是口算验证
                        </span>
                      )}
                    </h4>

                    <div className="flex gap-2.5">
                      <input
                        type="text"
                        maxLength={12}
                        placeholder="设置新密码 (如: 1234)"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        className="flex-1 bg-background border-2 border-border/80 focus:border-primary px-3 py-1.5 rounded-lg font-bold"
                      />
                      <button
                        type="submit"
                        disabled={!newPin.trim()}
                        className="btn-push-accent px-4 py-1.5 py-2 font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        设置
                      </button>
                    </div>
                  </form>

                  {successMsg && (
                    <p className="text-[11px] font-bold text-emerald-600 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                      {successMsg}
                    </p>
                  )}

                  {getParentPassword() && (
                    <div className="border-t border-dashed border-border/40 pt-4 mt-2 flex justify-between items-center">
                      <span className="text-[11px] text-foreground/50">想退回到免手动密码的口算算术题状态吗？</span>
                      <button
                        type="button"
                        onClick={handleClearPin}
                        className="px-2.5 py-1 text-[11px] font-bold border border-rose-300 hover:bg-rose-50 text-rose-500 rounded-lg cursor-pointer"
                      >
                        清空密码
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setShowSettingsModal(false)}
                    className="btn-push py-2.5 font-bold text-stone-950 mt-4"
                  >
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>完成设置</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
