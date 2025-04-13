import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Title from './Title';
import BrowserButton from './BrowserButton';
import { FaUmbrellaBeach } from "react-icons/fa6";

const Relax = () => {
    const { t } = useTranslation();

    return (
        <div className="whiteBox rounded-4 p-3 my-3">
            <Title icon={<FaUmbrellaBeach size={24} />} text={t('relax')} />

            <p>
                <BrowserButton
                    link="https://www.perplexity.ai"
                    buttonText="Веб-сёрфинг"
                    variant="success"
                />
                <BrowserButton
                    link="https://archive.org"
                    buttonText="Веб-архив"
                    variant="secondary"
                />
                <BrowserButton
                    link="https://playpager.com/embed/sudoku/index.html"
                    buttonText="Судоку"
                    variant="info"
                />
                <BrowserButton
                    link="https://playpager.com/embed/solitaire/index.html"
                    buttonText="Solitaire"
                    variant="info"
                />
                <BrowserButton
                    link="https://playpager.com/embed/chess/index.html"
                    buttonText="Шахматы"
                    variant="info"
                />
                <BrowserButton
                    link="https://www.youtube.com/embed/videoseries?list=PLx0sYbCqOb8TBPRdmBHs5Iftvv9TPboYG"
                    buttonText="YouTube плейлист"
                    variant="primary"
                    size="sm"
                />
            </p>

        </div>
    );
}

export default Relax;