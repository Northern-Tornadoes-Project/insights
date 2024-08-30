// Use these width="641" height="613" to calculate an aspect ratio
const aspectRatio = 641 / 613;

export function CsslLogo({ size, className }: { size: number; className?: string }) {
	return (
		<svg
			width={size}
			height={size * aspectRatio}
			viewBox="0 0 641 613"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
		>
			<path d="M57 0H641V46H57V0Z" fill="currentColor" />
			<path d="M57 68H641V114H57V68Z" fill="currentColor" />
			<path d="M69 567H231V613H69V567Z" fill="currentColor" />
			<path d="M69 613V533H115V613H69Z" fill="currentColor" />
			<path d="M126 136H483V182H126V136Z" fill="currentColor" />
			<path d="M126 204H483V250H126V204Z" fill="currentColor" />
			<path d="M124 272H483V318H124V272Z" fill="currentColor" />
			<path
				d="M126 136C94.5198 136 69 161.52 69 193C69 224.48 94.5198 250 126 250V204C119.925 204 115 199.075 115 193C115 186.925 119.925 182 126 182V136Z"
				fill="currentColor"
			/>
			<path
				d="M57 0C25.5198 0 0 25.5198 0 57C0 88.4802 25.5198 114 57 114V68C50.9249 68 46 63.0751 46 57C46 50.9249 50.9249 46 57 46V0Z"
				fill="currentColor"
			/>
			<path
				d="M483 318C514.48 318 540 292.48 540 261C540 229.52 514.48 204 483 204V250C489.075 250 494 254.925 494 261C494 267.075 489.075 272 483 272V318Z"
				fill="currentColor"
			/>
			<path d="M124 340H348V386H124V340Z" fill="currentColor" />
			<path d="M124 408H348V454H124V408Z" fill="currentColor" />
			<path d="M124 476H348V522H124V476Z" fill="currentColor" />
			<path
				d="M124 340C92.5198 340 67 365.52 67 397C67 428.48 92.5198 454 124 454V408C117.925 408 113 403.075 113 397C113 390.925 117.925 386 124 386V340Z"
				fill="currentColor"
			/>
			<path
				d="M348 522C379.48 522 405 496.48 405 465C405 433.52 379.48 408 348 408V454C354.075 454 359 458.925 359 465C359 471.075 354.075 476 348 476V522Z"
				fill="currentColor"
			/>
			<path d="M56 0.3125L58 0V46H56V0.3125Z" fill="currentColor" />
			<path d="M56 68.3125L58 68V114L56 113V68.3125Z" fill="currentColor" />
			<path d="M125 136.312L127 136V182H125V136.312Z" fill="currentColor" />
			<path d="M125 204.312L127 204V250L125 249V204.312Z" fill="currentColor" />
			<path d="M482 204.312L484 204V250H482V204.312Z" fill="currentColor" />
			<path d="M482 272.312L484 272V318L482 317V272.312Z" fill="currentColor" />
			<path d="M123 340.312L125 340V386H123V340.312Z" fill="currentColor" />
			<path d="M123 408.312L125 408V454L123 453V408.312Z" fill="currentColor" />
			<path d="M347 408.312L349 408V454H347V408.312Z" fill="currentColor" />
			<path d="M347 476.312L349 476V522L347 521V476.312Z" fill="currentColor" />
		</svg>
	);
}
