import imgRectangle from "./5d56f6223b9842e626890cbaec4c9659e258cbdb.png";

function Frame() {
  return (
    <div className="[word-break:break-word] content-stretch flex flex-col gap-[4px] items-start leading-[normal] p-[16px] relative shrink-0 w-full" data-name="Frame">
      <p className="font-['Instrument_Serif:Regular',sans-serif] not-italic relative shrink-0 text-[#0f2922] text-[20px] w-full">Rishikesh Ganga</p>
      <p className="font-['DM_Sans:Regular',sans-serif] font-normal relative shrink-0 text-[#4a5568] text-[13px] w-full" style={{ fontVariationSettings: '"opsz" 14' }}>{`Holy river & yoga capital`}</p>
    </div>
  );
}

export default function DestCard() {
  return (
    <div className="bg-white relative rounded-[16px] size-full" data-name="dest-card">
      <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[inherit] size-full">
        <div className="h-[160px] relative shrink-0 w-full" data-name="Rectangle">
          <img alt="" className="absolute inset-0 max-w-none object-cover pointer-events-none size-full" src={imgRectangle} />
        </div>
        <Frame />
      </div>
      <div aria-hidden className="absolute border border-[#e2e8f0] border-solid inset-0 pointer-events-none rounded-[16px]" />
    </div>
  );
}