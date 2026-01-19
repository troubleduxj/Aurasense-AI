
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input, Select } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useTheme, ThemeColor, BorderRadius, ThemeDensity, ThemeShadow } from '../contexts/ThemeContext';

export const ComponentGalleryPage: React.FC = () => {
  const { 
      primaryColor, setPrimaryColor, 
      borderRadius, setBorderRadius,
      density, setDensity,
      shadowMode, setShadowMode
  } = useTheme();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');

  const colors: ThemeColor[] = ['indigo', 'blue', 'violet', 'emerald', 'rose', 'amber', 'cyan', 'slate'];
  const radii: BorderRadius[] = ['none', 'sm', 'md', 'lg', 'xl', 'full'];
  const densities: ThemeDensity[] = ['normal', 'compact'];
  const shadows: ThemeShadow[] = ['none', 'soft', 'hard'];

  return (
    <div className="space-y-8 pb-20">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-800">UI 组件库</h2>
        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-2">AuraSense Design System & Configurator</p>
      </div>

      {/* Theme Configurator */}
      <section className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-12">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
              <div className={`w-8 h-8 rounded-full bg-${primaryColor}-500 text-white flex items-center justify-center shadow-lg shadow-${primaryColor}-200`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div>
                  <h3 className="text-lg font-bold text-slate-800">Global Theme Settings</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Customize System Appearance</p>
              </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Color */}
              <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Primary Color</label>
                  <div className="flex flex-wrap gap-2">
                      {colors.map(color => (
                          <button
                            key={color}
                            onClick={() => setPrimaryColor(color)}
                            className={`
                                w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center
                                ${primaryColor === color ? `border-${color}-500 scale-110 shadow-lg` : 'border-transparent hover:scale-105'}
                            `}
                            style={{ backgroundColor: `var(--color-${color}-500)` }}
                          >
                              <div className={`w-full h-full rounded-full bg-${color}-500 border-2 border-white`}></div>
                          </button>
                      ))}
                  </div>
              </div>

              {/* Radius */}
              <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Border Radius</label>
                  <div className="flex flex-wrap gap-2">
                      {radii.map(r => (
                          <button
                            key={r}
                            onClick={() => setBorderRadius(r)}
                            className={`
                                px-2 py-1 text-[10px] font-bold uppercase border transition-all rounded-lg
                                ${borderRadius === r 
                                    ? `bg-slate-800 text-white border-slate-800 shadow-md` 
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}
                            `}
                          >
                              {r}
                          </button>
                      ))}
                  </div>
              </div>

              {/* Density */}
              <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Density</label>
                  <div className="flex flex-wrap gap-2">
                      {densities.map(d => (
                          <button
                            key={d}
                            onClick={() => setDensity(d)}
                            className={`
                                px-3 py-1.5 text-xs font-bold uppercase border transition-all rounded-lg flex-1
                                ${density === d 
                                    ? `bg-slate-800 text-white border-slate-800 shadow-md` 
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}
                            `}
                          >
                              {d}
                          </button>
                      ))}
                  </div>
              </div>

              {/* Shadow */}
              <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Shadow Depth</label>
                  <div className="flex flex-wrap gap-2">
                      {shadows.map(s => (
                          <button
                            key={s}
                            onClick={() => setShadowMode(s)}
                            className={`
                                px-3 py-1.5 text-xs font-bold uppercase border transition-all rounded-lg flex-1
                                ${shadowMode === s 
                                    ? `bg-slate-800 text-white border-slate-800 shadow-md` 
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}
                            `}
                          >
                              {s}
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      </section>

      {/* Buttons */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-slate-700 border-b border-slate-200 pb-2">Buttons</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Variants</h4>
                <div className="flex flex-wrap gap-4 items-center">
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="success">Success</Button>
                    <Button variant="danger">Danger</Button>
                    <Button variant="outline">Outline</Button>
                    <Button variant="ghost">Ghost</Button>
                </div>
            </Card>
            <Card className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Sizes & Icons</h4>
                <div className="flex flex-wrap gap-4 items-center">
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                    <Button icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}>With Icon</Button>
                    <Button disabled>Disabled</Button>
                </div>
            </Card>
        </div>
      </section>

      {/* Badges */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-slate-700 border-b border-slate-200 pb-2">Badges</h3>
        <Card className="space-y-6">
            <div className="flex flex-wrap gap-4">
                <Badge variant="primary">Primary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="danger">Danger</Badge>
                <Badge variant="neutral">Neutral</Badge>
            </div>
            <div className="flex flex-wrap gap-4">
                <Badge variant="success" dot>Online</Badge>
                <Badge variant="warning" dot>Check</Badge>
                <Badge variant="danger" dot>Error</Badge>
                <Badge variant="neutral" dot>Offline</Badge>
            </div>
        </Card>
      </section>

      {/* Inputs */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-slate-700 border-b border-slate-200 pb-2">Inputs & Selects</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="space-y-4">
                <Input label="Standard Input" placeholder="Type something..." value={inputValue} onChange={e => setInputValue(e.target.value)} />
                <Input label="With Icon" icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>} placeholder="Search..." />
                <div className="flex gap-4">
                    <Input placeholder="No Label" />
                    <Input disabled placeholder="Disabled" />
                </div>
            </Card>
            <Card className="space-y-4">
                <Select 
                    label="Standard Select" 
                    value={selectValue}
                    onChange={e => setSelectValue(e.target.value)}
                    options={[
                        { label: 'Option 1', value: '1' },
                        { label: 'Option 2', value: '2' },
                        { label: 'Option 3', value: '3' },
                    ]}
                />
                <Select label="Disabled Select" disabled>
                    <option>Cannot select</option>
                </Select>
            </Card>
        </div>
      </section>

      {/* Cards */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-slate-700 border-b border-slate-200 pb-2">Cards</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
                <h4 className="font-bold text-lg mb-2">Standard Card</h4>
                <p className="text-slate-500 text-sm">This is a basic card component with padding and rounded corners.</p>
            </Card>
            <Card hoverEffect>
                <h4 className="font-bold text-lg mb-2">Hover Effect Card</h4>
                <p className="text-slate-500 text-sm">Hover over me to see a lift and shadow effect. Good for interactive items.</p>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
                <h4 className="font-bold text-lg mb-2 text-white">Dark Card</h4>
                <p className="text-slate-400 text-sm">Custom classes can be passed to override styles.</p>
            </Card>
        </div>
      </section>

      {/* Modals */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-slate-700 border-b border-slate-200 pb-2">Modals</h3>
        <Card className="flex items-center gap-4">
            <Button onClick={() => setIsModalOpen(true)}>Open Demo Modal</Button>
            <span className="text-sm text-slate-500">Click to test the modal component.</span>
        </Card>
      </section>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Component Demo"
        subtitle="Modal Component"
        footer={
            <div className="flex justify-end gap-2 w-full">
                <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Close</Button>
                <Button onClick={() => alert('Action!')}>Confirm</Button>
            </div>
        }
      >
          <div className="space-y-4">
              <p className="text-slate-600">This is a reusable modal component.</p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <h5 className="font-bold text-slate-800 mb-2">Features:</h5>
                  <ul className="list-disc list-inside text-sm text-slate-500 space-y-1">
                      <li>Backdrop blur</li>
                      <li>Animation (Fade & Zoom)</li>
                      <li>Keyboard support (ESC to close)</li>
                      <li>Scroll lock on body</li>
                  </ul>
              </div>
          </div>
      </Modal>
    </div>
  );
};
