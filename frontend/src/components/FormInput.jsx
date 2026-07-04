const FormInput = ({
  id,
  label,
  type = 'text',
  placeholder,
  icon: Icon,
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  focusedField,
  showToggle,
  toggleVisible,
  onToggle
}) => {
  const isFocused = focusedField === id;

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-white/80 uppercase tracking-wider">
        {label}
      </label>
      <div className={`relative group transition-all duration-300 ${isFocused ? 'scale-[1.02]' : ''}`}>
        {Icon && (
          <Icon
            className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-all ${
              isFocused ? 'text-cyan-400 scale-110' : 'text-white/40'
            }`}
          />
        )}
        <input
          id={id}
          type={showToggle ? (toggleVisible ? 'text' : 'password') : type}
          placeholder={placeholder}
          onFocus={onFocus}
          onBlur={onBlur}
          className={`w-full ${Icon ? 'pl-12' : 'pl-4'} ${showToggle ? 'pr-12' : 'pr-4'} py-2.5 bg-white/5 border-2 rounded-xl backdrop-blur transition-all duration-300 focus:outline-none text-sm ${
            error
              ? 'border-red-500/50 focus:border-red-500 focus:bg-red-500/10'
              : isFocused
              ? 'border-cyan-400/50 focus:border-cyan-400 focus:bg-cyan-500/10'
              : 'border-white/10 group-hover:border-white/20'
          } text-white placeholder-white/30 font-medium`}
          value={value}
          onChange={onChange}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors"
          >
            {onToggle && toggleVisible ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-red-400 text-xs font-medium flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  );
};

export default FormInput;
